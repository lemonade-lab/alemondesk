package service

import (
	"alemonapp/src/config"
	"alemonapp/src/files"
	"alemonapp/src/logger"
	logicbot "alemonapp/src/logic/bot"
	"alemonapp/src/paths"
	embedredis "alemonapp/src/redis"
	"alemonapp/src/utils"
	"embed"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/kardianos/service"
)

// ServiceConfig 服务配置
type ServiceConfig struct {
	Login string // --login 参数，指定启动的平台
}

// Program 实现 service.Interface
type program struct {
	cfg  ServiceConfig
	quit chan struct{}
	wg   sync.WaitGroup
}

var (
	svcInstance service.Service
	mu          sync.Mutex
)

func newProgram(cfg ServiceConfig) *program {
	return &program{
		cfg:  cfg,
		quit: make(chan struct{}),
	}
}

// Start 服务启动时调用
func (p *program) Start(s service.Service) error {
	logger.Info("服务模式启动，login=%s", p.cfg.Login)
	p.wg.Add(1)
	go p.run()
	return nil
}

// run 服务主逻辑（无 GUI）
func (p *program) run() {
	defer p.wg.Done()

	// 启动内置 Redis
	redisAddr, err := embedredis.Start()
	if err != nil {
		logger.Error("服务模式：启动内置 Redis 失败: %v", err)
	} else {
		logger.Info("服务模式：Redis 可用地址: %s", redisAddr)
	}

	// 解出资源文件（需要 embed.FS，由 main 包传入）
	if resourcesFS != nil {
		files.Create(*resourcesFS)
	}

	// 确保 Node.js 可用
	_, nodeErr := files.GetSystemExePath()
	if nodeErr != nil {
		logger.Info("服务模式：系统未找到 Node.js，开始解压内置 Node.js")
		if extractErr := files.ExtractNodeJS(); extractErr != nil {
			logger.Error("服务模式：解压 Node.js 失败: %v", extractErr)
		}
	}

	// 确保机器人目录存在
	botPath := paths.CreateBotPath(config.BotName)
	if _, err := os.Stat(botPath); os.IsNotExist(err) {
		if copyErr := utils.CopyDir(paths.GetBotTemplate(), botPath); copyErr != nil {
			logger.Error("服务模式：创建机器人目录失败: %v", copyErr)
		}
	}

	// 构建启动参数
	var args []string
	if p.cfg.Login != "" {
		args = append(args, "--login", p.cfg.Login)
	}

	// 启动机器人
	_, runErr := logicbot.Run(config.BotName, args)
	if runErr != nil {
		logger.Error("服务模式：启动机器人失败: %v", runErr)
	} else {
		logger.Info("服务模式：机器人已启动")
	}

	// 等待退出信号
	<-p.quit
}

// Stop 服务停止时调用
func (p *program) Stop(s service.Service) error {
	logger.Info("服务模式正在停止")

	// 停止机器人
	_, err := logicbot.Stop(config.BotName)
	if err != nil {
		logger.Error("服务模式：停止机器人失败: %v", err)
	}

	// 关闭 Redis
	embedredis.Close()

	close(p.quit)
	p.wg.Wait()
	return nil
}

// --- 资源注入（由 main 包调用） ---

var resourcesFS *embed.FS

// SetResourcesFS 注入嵌入资源
func SetResourcesFS(fs *embed.FS) {
	resourcesFS = fs
}

// --- 对外 API ---

func getServiceConfig() *service.Config {
	return &service.Config{
		Name:        "ALemonDeskService",
		DisplayName: "ALemonDesk Service",
		Description: "ALemonDesk 后台服务，用于无 GUI 环境下运行机器人",
	}
}

func newService(cfg ServiceConfig) (service.Service, error) {
	prg := newProgram(cfg)
	return service.New(prg, getServiceConfig())
}

// Install 安装为系统服务
func Install(login string) error {
	mu.Lock()
	defer mu.Unlock()

	svcCfg := getServiceConfig()
	// 将参数写入服务启动参数（SCM 会用这些参数启动进程）
	if login != "" {
		svcCfg.Arguments = []string{"--service-run", "--login", login}
	} else {
		svcCfg.Arguments = []string{"--service-run"}
	}

	prg := newProgram(ServiceConfig{Login: login})
	s, err := service.New(prg, svcCfg)
	if err != nil {
		return fmt.Errorf("创建服务失败: %w", err)
	}
	return s.Install()
}

// Uninstall 卸载系统服务
func Uninstall() error {
	mu.Lock()
	defer mu.Unlock()

	s, err := newService(ServiceConfig{})
	if err != nil {
		return fmt.Errorf("创建服务失败: %w", err)
	}
	return s.Uninstall()
}

// Start 启动系统服务
func Start() error {
	mu.Lock()
	defer mu.Unlock()

	s, err := newService(ServiceConfig{})
	if err != nil {
		return fmt.Errorf("创建服务失败: %w", err)
	}
	return s.Start()
}

// Stop 停止系统服务
func Stop() error {
	mu.Lock()
	defer mu.Unlock()

	s, err := newService(ServiceConfig{})
	if err != nil {
		return fmt.Errorf("创建服务失败: %w", err)
	}
	return s.Stop()
}

// Status 获取服务状态
func Status() (string, error) {
	mu.Lock()
	defer mu.Unlock()

	s, err := newService(ServiceConfig{})
	if err != nil {
		return "unknown", fmt.Errorf("创建服务失败: %w", err)
	}
	status, err := s.Status()
	if err != nil {
		return "unknown", err
	}
	switch status {
	case service.StatusRunning:
		return "running", nil
	case service.StatusStopped:
		return "stopped", nil
	default:
		return "unknown", nil
	}
}

// RunAsService 以服务模式运行（由 --service run 调用）
func RunAsService(cfg ServiceConfig) error {
	prg := newProgram(cfg)
	svcCfg := getServiceConfig()
	s, err := service.New(prg, svcCfg)
	if err != nil {
		return fmt.Errorf("创建服务失败: %w", err)
	}

	// 如果是交互模式（非服务管理器启动），处理信号
	if service.Interactive() {
		go func() {
			sigChan := make(chan os.Signal, 1)
			signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
			<-sigChan
			_ = s.Stop()
		}()
	}

	return s.Run()
}
