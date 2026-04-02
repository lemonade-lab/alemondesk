package redis

import (
	"alemonapp/src/logger"
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/alicebob/miniredis/v2"
)

var (
	instance *miniredis.Miniredis
	mu       sync.Mutex
	addr     string // 实际使用的 Redis 地址
)

const defaultAddr = "127.0.0.1:6379"

// isRedisRunning 检测指定地址是否已有 Redis 服务在运行
func isRedisRunning(address string) bool {
	conn, err := net.DialTimeout("tcp", address, 2*time.Second)
	if err != nil {
		return false
	}
	// 发送 PING 命令验证是 Redis 协议
	_, _ = conn.Write([]byte("*1\r\n$4\r\nPING\r\n"))
	buf := make([]byte, 64)
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	n, err := conn.Read(buf)
	conn.Close()
	if err != nil || n == 0 {
		return false
	}
	// Redis 回复 +PONG\r\n
	resp := string(buf[:n])
	return resp == "+PONG\r\n"
}

// Start 按需启动内置 Redis。
// 如果系统已有 Redis 在运行则跳过，返回实际可用的地址。
func Start() (string, error) {
	mu.Lock()
	defer mu.Unlock()

	// 已经启动过
	if instance != nil {
		return addr, nil
	}

	// 检测系统 Redis 是否已运行
	if isRedisRunning(defaultAddr) {
		addr = defaultAddr
		logger.Info("检测到系统 Redis 已在 %s 运行，跳过内置启动", addr)
		return addr, nil
	}

	// 启动 miniredis，监听 6379 端口
	m := miniredis.NewMiniRedis()
	err := m.StartAddr(defaultAddr)
	if err != nil {
		return "", fmt.Errorf("启动内置 Redis 失败: %w", err)
	}

	instance = m
	addr = m.Addr()
	logger.Info("内置 Redis 已启动，监听地址: %s", addr)
	return addr, nil
}

// Addr 返回当前可用的 Redis 地址（需先调用 Start）
func Addr() string {
	mu.Lock()
	defer mu.Unlock()
	return addr
}

// IsBuiltin 返回当前是否使用内置 Redis
func IsBuiltin() bool {
	mu.Lock()
	defer mu.Unlock()
	return instance != nil
}

// Status 返回 Redis 状态信息
type RedisStatus struct {
	Running bool   `json:"running"`
	Addr    string `json:"addr"`
	Builtin bool   `json:"builtin"` // true=内置, false=系统外部
}

func GetStatus() RedisStatus {
	mu.Lock()
	defer mu.Unlock()
	running := instance != nil || isRedisRunning(defaultAddr)
	return RedisStatus{
		Running: running,
		Addr:    addr,
		Builtin: instance != nil,
	}
}

// Restart 重启内置 Redis（先关再开）
func Restart() (string, error) {
	Close()
	return Start()
}

// Close 关闭内置 Redis（如果有启动的话）
func Close() {
	mu.Lock()
	defer mu.Unlock()
	if instance != nil {
		instance.Close()
		instance = nil
		addr = ""
		logger.Info("内置 Redis 已关闭")
	}
}
