package logicexpansions

import (
	"alemonapp/src/files"
	"alemonapp/src/models"
	"alemonapp/src/paths"
	"alemonapp/src/process"
	"alemonapp/src/utils"
	"os"
	"path/filepath"
)

// 是否在运行
func IsRunning(name string) bool {
	pm := process.GetProcessManager()
	expansionsName := name + "-desk"
	return pm.IsRunning(expansionsName)
}

// 运行
func Run(name string, args []string) (string, error) {
	manager := files.GetNodeJSManager()
	nodeExe, err := manager.GetNodeExePath()
	// 检查系统是否安装了 Node.js
	if err != nil {
		return "未找到NodeJS", err
	}
	expansionsName := name + "-desk"
	pm := process.GetProcessManager()
	if pm.IsRunning(expansionsName) {
		return "已经在运行", nil
	}
	files := []string{
		paths.GetBotDependencyPath(name),
		paths.GetBotEntryFilePath(name),
	}
	nodeModules := utils.ExistsPath(files)
	if !nodeModules {
		return "请先安装依赖", os.ErrNotExist
	}
	// 目录
	botPath := paths.CreateBotPath(name)
	var indexPath string
	tryFiles := []string{
		filepath.Join("alemonjs", "desktop.js"),
	}
	found := false
	for _, fp := range tryFiles {
		if _, err := os.Stat(filepath.Join(botPath, fp)); err == nil {
			indexPath = fp
			found = true
			break
		}
	}
	if !found {
		return "启动脚本不存在,请新建desktop.js", os.ErrNotExist
	}
	pidFile := paths.GetPidFilePath(expansionsName)
	// 交给进程管理器托管
	pm.AddProcess(process.NodeProcessConfig{
		Name:     expansionsName,
		Dir:      botPath,
		Node:     nodeExe,
		ScriptJS: indexPath,
		// LogPath:     logPath,
		PidFile:              pidFile,
		EnvFilePath:          paths.GetBotEnvFilePath(name),
		Args:                 args,
		CommunicationEnabled: true, // 开启通讯
		// HandleMessage:        HandleMessage,
		// 支持直接加环境变量
		Env: map[string]string{
			// 关闭日志时间
			// "LOGGER_TIME": "false",
			// 关闭日志级别
			// "LOGGER_LEVEL": "false",
		},
	})
	// 启动
	proc := pm.GetProcess(expansionsName)
	if proc == nil {
		return "进程未注册", os.ErrNotExist
	}
	err = proc.Start()
	if err != nil {
		return "启动失败", err
	}
	return "", nil
}

// 停止
func Stop(name string) (string, error) {
	pm := process.GetProcessManager()
	expansionsName := name + "-desk"
	proc := pm.GetProcess(expansionsName)
	if proc == nil {
		return "进程未注册", os.ErrNotExist
	}
	err := proc.Stop()
	if err != nil {
		return "停止失败", err
	}
	return "", nil
}

// 重启
func Restart(name string) (string, error) {
	pm := process.GetProcessManager()
	expansionsName := name + "-desk"
	proc := pm.GetProcess(expansionsName)
	if proc == nil {
		return "进程未注册", os.ErrNotExist
	}
	err := proc.Restart()
	if err != nil {
		return "重启失败", err
	}
	return "", nil
}

func Info(name string) (models.BotInfoResponse, error) {
	botPath := paths.GetBotPath(name)
	expansionsName := name + "-desk"

	files := []string{
		paths.GetBotDependencyPath(name),
		paths.GetBotEntryFilePath(name),
	}
	nodeModules := utils.ExistsPath(files)

	// 获取文件夹创建时间
	fileInfo, err := os.Stat(botPath)
	createAt := ""
	if err == nil {
		createAt = fileInfo.ModTime().Format("2006-01-02 15:04:05")
	}

	pm := process.GetProcessManager()

	proc := pm.GetProcess(expansionsName)
	if proc == nil {
		return models.BotInfoResponse{
			Code: 0,
			Msg:  "进程未注册",
			Data: models.BotInfo{
				Name:   expansionsName,
				Status: 0,
				Pid:    0,
				// Port:        0,
				NodeModules: nodeModules,
				CreateAt:    createAt,
			},
		}, nil
	}

	status, pid := proc.Info()
	if status == "running" && pid > 0 {
		return models.BotInfoResponse{
			Code: 1,
			Msg:  "获取进程信息成功",
			Data: models.BotInfo{
				Name:   expansionsName,
				Status: 1,
				Pid:    pid,
				// Port:        proc.Config.Port,
				NodeModules: nodeModules,
				CreateAt:    createAt,
			},
		}, nil
	}
	return models.BotInfoResponse{
		Code: 0,
		Msg:  "进程未运行",
		Data: models.BotInfo{
			Name:   expansionsName,
			Status: 0,
			Pid:    0,
			// Port:        0,
			NodeModules: nodeModules,
			CreateAt:    createAt,
		},
	}, nil
}

func Managed(name string) *process.ManagedProcess {
	pm := process.GetProcessManager()
	expansionsName := name + "-desk"
	return pm.GetProcess(expansionsName)
}
