package windowservice

import (
	"alemonapp/src/logger"
	embedredis "alemonapp/src/redis"
	svc "alemonapp/src/service"
	"context"
	"runtime"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type App struct {
	ctx         context.Context
	application *application.EventManager
}

func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) SetApplication(app *application.EventManager) {
	a.application = app
}

// ServiceSupported 当前系统是否支持服务模式
func (a *App) ServiceSupported() bool {
	return runtime.GOOS == "windows" || runtime.GOOS == "linux"
}

// ServiceInstall 安装为系统服务
func (a *App) ServiceInstall(login string) string {
	err := svc.Install(login)
	if err != nil {
		logger.Error("安装服务失败: %v", err)
		return err.Error()
	}
	logger.Info("服务安装成功，login=%s", login)
	return ""
}

// ServiceUninstall 卸载系统服务
func (a *App) ServiceUninstall() string {
	err := svc.Uninstall()
	if err != nil {
		logger.Error("卸载服务失败: %v", err)
		return err.Error()
	}
	logger.Info("服务已卸载")
	return ""
}

// ServiceStart 启动系统服务
func (a *App) ServiceStart() string {
	err := svc.Start()
	if err != nil {
		logger.Error("启动服务失败: %v", err)
		return err.Error()
	}
	logger.Info("服务已启动")
	return ""
}

// ServiceStop 停止系统服务
func (a *App) ServiceStop() string {
	err := svc.Stop()
	if err != nil {
		logger.Error("停止服务失败: %v", err)
		return err.Error()
	}
	logger.Info("服务已停止")
	return ""
}

// ServiceStatus 获取服务运行状态
func (a *App) ServiceStatus() string {
	status, err := svc.Status()
	if err != nil {
		logger.Error("获取服务状态失败: %v", err)
		return "unknown"
	}
	return status
}

// --- Redis 管理 ---

type RedisStatusInfo struct {
	Running bool   `json:"running"`
	Addr    string `json:"addr"`
	Builtin bool   `json:"builtin"`
}

// RedisGetStatus 获取 Redis 状态
func (a *App) RedisGetStatus() RedisStatusInfo {
	s := embedredis.GetStatus()
	return RedisStatusInfo{
		Running: s.Running,
		Addr:    s.Addr,
		Builtin: s.Builtin,
	}
}

// RedisStart 启动内置 Redis
func (a *App) RedisStart() string {
	addr, err := embedredis.Start()
	if err != nil {
		logger.Error("启动 Redis 失败: %v", err)
		return err.Error()
	}
	logger.Info("Redis 已启动: %s", addr)
	return ""
}

// RedisStop 停止内置 Redis
func (a *App) RedisStop() string {
	embedredis.Close()
	logger.Info("Redis 已停止")
	return ""
}

// RedisRestart 重启内置 Redis
func (a *App) RedisRestart() string {
	_, err := embedredis.Restart()
	if err != nil {
		logger.Error("重启 Redis 失败: %v", err)
		return err.Error()
	}
	logger.Info("Redis 已重启")
	return ""
}
