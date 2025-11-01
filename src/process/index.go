package process

import (
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strconv"
	"sync"
	"syscall"
	"time"
)

// node 进程信息
type NodeProcessConfig struct {
	Name        string
	Dir         string
	Node        string
	ScriptJS    string
	LogPath     string
	PidFile     string
	EnvFilePath string
	Env         map[string]string
	// Port                 int
	Args                 []string
	CommunicationEnabled bool
}

// 持久化结构体（包含状态）
type NodeProcessPersist struct {
	Config NodeProcessConfig
	Status string
}

// 进程管理器
type ManagedProcess struct {
	Config         NodeProcessConfig
	Cmd            *exec.Cmd
	Ctx            context.Context
	Cancel         context.CancelFunc
	Status         string
	RestartWait    time.Duration
	mu             sync.Mutex
	stdinPipe      io.WriteCloser // 新增：用于向Node.js发送消息
	RestartCount   int
	MaxRestarts    int
	LastStartTime  time.Time
	healthTicker   *time.Ticker
	healthStopChan chan struct{}
}

const Restart_Wait = 5 * time.Second
const MaxRestarts = 3
const TIME_OUT = 30 * time.Second
const StatusRunning = "running"
const StatusStopped = "stopped"
const StatusPaused = "paused"

// 全局进程管理器
var (
	globalPM   *ProcessManager
	pmInitOnce sync.Once
)

func GetProcessManager() *ProcessManager {
	pmInitOnce.Do(func() {
		globalPM = NewProcessManager()
	})
	return globalPM
}

// 进程管理器
type ProcessManager struct {
	Processes map[string]*ManagedProcess
	mu        sync.Mutex
}

// 创建一个新的进程管理器
func NewProcessManager() *ProcessManager {
	return &ProcessManager{
		Processes: make(map[string]*ManagedProcess),
	}
}

// 删除进程
func (pm *ProcessManager) RemoveProcess(name string) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	if p, ok := pm.Processes[name]; ok {
		p.Stop()
		delete(pm.Processes, name)
		// 删除持久化配置
		RemoveProcessConfig(name)
	}
}

// 添加进程
func (pm *ProcessManager) AddProcess(cfg NodeProcessConfig) {
	// runConfig := ReadBotConfig(cfg.Name)
	pm.mu.Lock()
	defer pm.mu.Unlock()
	// if _, exists := pm.Processes[cfg.Name]; exists {
	// 	pm.Processes[cfg.Name].Config.Port = runConfig.Port // 更新端口
	// 	return
	// }
	// cfg.Port = runConfig.Port // 使用配置的端口
	mp := NewManagedProcess(cfg)
	pm.Processes[cfg.Name] = mp
}

// 获取进程配置文件路径
func GetProcessConfigFilePath() string {
	filePath := paths.GetProcessConfigFilePath()
	// 如果不存在，创建文件，并写入"{}"
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		// 创建文件
		file, err := os.Create(filePath)
		if err != nil {
			logger.Error("创建进程配置文件失败: %v", err)
		}
		defer file.Close()
		// 写入空的 JSON 对象
		_, err = file.WriteString("{}")
		if err != nil {
			logger.Error("写入空JSON失败: %v", err)
		}
	}
	return filePath
}

// 创建一个新的进程管理器
func NewManagedProcess(cfg NodeProcessConfig) *ManagedProcess {
	ctx, cancel := context.WithCancel(context.Background())
	return &ManagedProcess{
		Config:         cfg,
		Ctx:            ctx,
		Cancel:         cancel,
		Status:         StatusStopped,
		RestartWait:    Restart_Wait,
		MaxRestarts:    MaxRestarts,
		healthStopChan: make(chan struct{}, 1),
	}
}

type multiplexWriter struct {
	writers []io.Writer
}

func (m *multiplexWriter) Write(p []byte) (n int, err error) {
	// ✅ 记录最后一个错误
	var lastErr error
	for _, w := range m.writers {
		if _, writeErr := w.Write(p); writeErr != nil {
			lastErr = writeErr
			logger.Warn("multiplexWriter: write failed: %v", writeErr)
		}
	}
	// 即使有错误也返回成功长度，确保所有writer都尝试写入
	return len(p), lastErr
}

// 启动进程
func (mp *ManagedProcess) Start() error {
	mp.mu.Lock()
	defer mp.mu.Unlock()
	// 检查进程是否已经在运行
	if mp.Status == StatusRunning {
		logger.Warn("%s 已经在运行中，无法重复启动", mp.Config.Name)
		return nil
	}
	// 取消旧的 context，防止泄漏
	if mp.Cancel != nil {
		mp.Cancel()
	}
	// 日志文件
	var err error
	mp.Ctx, mp.Cancel = context.WithCancel(context.Background())
	args := append([]string{mp.Config.ScriptJS}, mp.Config.Args...)
	mp.Cmd = utils.CommandContext(mp.Ctx, mp.Config.Node, args...)
	mp.Cmd.Env = LoadEnvironment(mp.Config.EnvFilePath)
	// 还要支持，直接传入的环境变量 mp.Config.Env
	for key, value := range mp.Config.Env {
		mp.Cmd.Env = append(mp.Cmd.Env, fmt.Sprintf("%s=%s", key, value))
	}

	// 仅开启通讯的进程设置标准输入输出管道
	if mp.Config.CommunicationEnabled {
		// 获取消息处理器
		handleMessagesMu.RLock()
		messageHandler := handleMessages[mp.Config.Name]
		handleMessagesMu.RUnlock()
		
		// 创建多路复用writer
		multiStdout := &multiplexWriter{
			writers: []io.Writer{
				&IPCMessageWriter{ // IPC消息处理
					ProcessName:    mp.Config.Name,
					MessageHandler: messageHandler,
				},
			},
		}
		mp.Cmd.Stdout = multiStdout
		mp.Cmd.Stderr = &logger.LogWriter{Level: "error"}
		stdinPipe, err := mp.Cmd.StdinPipe()
		if err != nil {
			logger.Error("[%s] create stdin pipe failed: %v", mp.Config.Name, err)
			return err
		}
		mp.stdinPipe = stdinPipe
	} else {
		mp.Cmd.Stdout = &logger.LogWriter{Level: "info"}
		mp.Cmd.Stderr = &logger.LogWriter{Level: "error"}
	}

	if mp.Config.Dir != "" {
		mp.Cmd.Dir = mp.Config.Dir
	}
	mp.LastStartTime = time.Now()
	err = mp.Cmd.Start()
	if err == nil {
		mp.Status = StatusRunning
		// 写入PID文件
		if mp.Config.PidFile != "" && mp.Cmd.Process != nil {
			_ = os.WriteFile(mp.Config.PidFile, []byte(strconv.Itoa(mp.Cmd.Process.Pid)), 0644)
		}
		// 启动健康检查
		go mp.monitor()
		// 启动健康检查循环
		go mp.healthCheckLoop()
	}
	// 状态持久化
	SaveProcess(mp.Config.Name, mp.Config, mp.Status)
	return err
}

// 进程退出/Stop 时清理 PID 文件
func (mp *ManagedProcess) cleanupPIDFile() {
	if mp.Config.PidFile != "" {
		_ = os.Remove(mp.Config.PidFile)
	}
}

// 监控进程
func (mp *ManagedProcess) monitor() {
	_ = mp.Cmd.Wait()
	mp.cleanupPIDFile()
	
	mp.mu.Lock()
	// 关闭 stdin 管道
	if mp.stdinPipe != nil {
		_ = mp.stdinPipe.Close()
		mp.stdinPipe = nil
	}

	if mp.Status != StatusRunning {
		mp.mu.Unlock()
		return
	}
	
	// 计算运行时长和是否需要重启
	alive := time.Since(mp.LastStartTime)
	shouldRestart := false
	
	if alive > 30*time.Second {
		mp.RestartCount = 0
	} else {
		mp.RestartCount++
	}
	
	if mp.RestartCount <= mp.MaxRestarts {
		shouldRestart = true
		logger.Info("[%s] exited, restarting in %v (count: %d/%d)\n", mp.Config.Name, mp.RestartWait, mp.RestartCount, mp.MaxRestarts)
	} else {
		logger.Info("[%s] too many restarts, giving up!\n", mp.Config.Name)
	}
	
	// 更新状态
	mp.Status = StatusStopped
	SaveProcess(mp.Config.Name, mp.Config, mp.Status)
	mp.mu.Unlock()
	
	// 在锁外处理重启，避免死锁
	if shouldRestart {
		time.Sleep(mp.RestartWait)
		mp.Start()
	}
}

// 停止进程
func (mp *ManagedProcess) Stop() error {
	mp.mu.Lock()
	defer mp.mu.Unlock()
	mp.Status = StatusStopped

	// 关闭 stdin 管道
	if mp.stdinPipe != nil {
		_ = mp.stdinPipe.Close()
		mp.stdinPipe = nil
	}

	if mp.Cancel != nil {
		mp.Cancel()
	}
	if mp.Cmd != nil && mp.Cmd.Process != nil {
		_ = mp.Cmd.Process.Kill()
	}
	// 等待进程退出
	mp.cleanupPIDFile()
	// 关闭日志文件
	mp.stopHealthCheck()
	// 持久化状态
	SaveProcess(mp.Config.Name, mp.Config, mp.Status)
	return nil
}

// 重启进程
func (mp *ManagedProcess) Restart() error {
	logger.Info("[%s] Restarting...", mp.Config.Name)
	mp.Stop()
	time.Sleep(mp.RestartWait)
	return mp.Start()
}

// 启动所有进程
func (pm *ProcessManager) StartAll() {
	pm.mu.Lock()
	processes := make([]*ManagedProcess, 0, len(pm.Processes))
	for _, p := range pm.Processes {
		processes = append(processes, p)
	}
	pm.mu.Unlock()
	
	// 使用 WaitGroup 追踪所有启动的 goroutine
	var wg sync.WaitGroup
	for _, p := range processes {
		wg.Add(1)
		go func(proc *ManagedProcess) {
			defer wg.Done()
			if err := proc.Start(); err != nil {
				logger.Error("[%s] 启动失败: %v", proc.Config.Name, err)
			}
		}(p)
	}
	// 可选：等待所有进程启动完成
	// wg.Wait()
}

// 停止所有进程
func (pm *ProcessManager) StopAll() {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	for _, p := range pm.Processes {
		p.Stop()
	}
}

// 定时健康检查：每 30 秒检查一次进程是否存活
func (mp *ManagedProcess) healthCheckLoop() {
	// ✅ 防止ticker泄漏
	mp.healthTicker = time.NewTicker(TIME_OUT)
	defer func() {
		mp.healthTicker.Stop()
		mp.healthTicker = nil
	}()
	
	for {
		select {
		case <-mp.healthTicker.C:
			if !mp.isProcessAlive() {
				logger.Info("[%s] health check failed, process not alive, restarting...", mp.Config.Name)
				// 直接调用 Restart，避免启动多个重启 goroutine
				if err := mp.Restart(); err != nil {
					logger.Error("[%s] restart failed: %v", mp.Config.Name, err)
				}
				return
			}
		case <-mp.healthStopChan:
			logger.Debug("[%s] health check stopped", mp.Config.Name)
			return
		}
	}
}

// 停止健康检查
func (mp *ManagedProcess) stopHealthCheck() {
	// ✅ 防止向nil channel发送
	if mp.healthStopChan != nil {
		select {
		case mp.healthStopChan <- struct{}{}:
		default:
		}
	}
	// ✅ 停止ticker防止泄漏
	if mp.healthTicker != nil {
		mp.healthTicker.Stop()
		mp.healthTicker = nil
	}
}

// 检查进程是否存活
func (mp *ManagedProcess) isProcessAlive() bool {
	mp.mu.Lock()
	defer mp.mu.Unlock()
	if mp.Cmd == nil || mp.Cmd.Process == nil {
		return false
	}
	// Signal 0 检查进程是否存活
	err := mp.Cmd.Process.Signal(syscall.Signal(0))
	return err == nil
}

// 获取进程
func (pm *ProcessManager) GetProcess(name string) *ManagedProcess {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	return pm.Processes[name]
}

// 指定进程是否在运行
func (pm *ProcessManager) IsRunning(name string) bool {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	if p, ok := pm.Processes[name]; ok {
		p.mu.Lock()
		defer p.mu.Unlock()
		return p.Status == StatusRunning
	}
	return false
}

// 信息：获取进程状态和 PID
func (mp *ManagedProcess) Info() (status string, pid int) {
	mp.mu.Lock()
	defer mp.mu.Unlock()
	pid = 0
	if mp.Cmd != nil && mp.Cmd.Process != nil {
		pid = mp.Cmd.Process.Pid
	}
	return mp.Status, pid
}

// 从 JSON 文件加载所有进程配置
func LoadAllProcessConfigs() (map[string]NodeProcessPersist, error) {
	filePath := GetProcessConfigFilePath()
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}
	cfgMap := make(map[string]NodeProcessPersist)
	if len(data) == 0 {
		return cfgMap, nil
	}
	err = json.Unmarshal(data, &cfgMap)
	return cfgMap, err
}

// 复活所有进程
func (pm *ProcessManager) ReviveAll() error {
	cfgMap, err := LoadAllProcessConfigs()
	if err != nil {
		return err
	}
	for name, persist := range cfgMap {
		// 只有之前是运行的，才会记录
		if persist.Status == StatusRunning {
			// 添加进程
			pm.AddProcess(persist.Config)
			// ✅ 使用闭包捕获变量
			go func(processName string) {
				if proc := pm.GetProcess(processName); proc != nil {
					if err := proc.Start(); err != nil {
						logger.Error("[%s] 复活失败: %v", processName, err)
					}
				}
			}(name)
		}
	}
	return nil
}

// 把当前进行追加保存到 JSON 文件
func SaveProcess(name string, Config NodeProcessConfig, status string) {
	cfgMap, err := LoadAllProcessConfigs()
	if err != nil {
		return
	}
	// 保存当前进程配置
	cfgMap[name] = NodeProcessPersist{
		Config: Config,
		Status: status,
	}
	// 保存到文件
	filePath := GetProcessConfigFilePath()
	data, err := json.Marshal(cfgMap)
	if err != nil {
		logger.Error("序列化进程配置失败: %v", err)
		return
	}
	err = os.WriteFile(filePath, data, 0644)
	if err != nil {
		logger.Error("保存进程配置到文件失败: %v", err)
		return
	}
}

// 从 JSON 文件加载 删除指定进程配置
func RemoveProcessConfig(name string) {
	cfgMap, err := LoadAllProcessConfigs()
	if err != nil {
		return
	}
	// 删除指定进程配置
	delete(cfgMap, name)
	// 保存到文件
	filePath := GetProcessConfigFilePath()
	data, err := json.Marshal(cfgMap)
	if err != nil {
		logger.Error("序列化进程配置失败: %v", err)
		return
	}
	err = os.WriteFile(filePath, data, 0644)
	if err != nil {
		logger.Error("保存进程配置到文件失败: %v", err)
		return
	}
}
