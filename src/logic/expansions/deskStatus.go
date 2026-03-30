package logicexpansions

import (
	"alemonapp/src/files"
	logicyarn "alemonapp/src/logic/yarn"
	"alemonapp/src/models"
	"alemonapp/src/paths"
	"alemonapp/src/process"
	"alemonapp/src/utils"
	"encoding/json"
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
	// 目录
	botPath := paths.CreateBotPath(name)

	// 确保 desktop.js 存在
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
		// 尝试从模板复制 desktop.js
		templateFile := filepath.Join(paths.GetBotTemplate(), "alemonjs", "desktop.js")
		targetDir := filepath.Join(botPath, "alemonjs")
		targetFile := filepath.Join(targetDir, "desktop.js")
		if err := os.MkdirAll(targetDir, 0755); err == nil {
			if src, err := os.ReadFile(templateFile); err == nil {
				if err := os.WriteFile(targetFile, src, 0644); err == nil {
					indexPath = filepath.Join("alemonjs", "desktop.js")
					found = true
				}
			}
		}
		if !found {
			return "启动脚本不存在,请新建desktop.js", os.ErrNotExist
		}
	}

	// 确保 package.json 包含扩展器所需的依赖
	depsChanged, err := ensureDeskDependencies(botPath)
	if err != nil {
		return "同步扩展器依赖失败", err
	}

	// 新增了依赖或 node_modules 不存在，自动执行 yarn install
	nodeModulesExist := utils.ExistsPath([]string{paths.GetBotDependencyPath(name)})
	if depsChanged || !nodeModulesExist {
		if _, err := logicyarn.Install(name); err != nil {
			return "自动安装依赖失败", err
		}
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

// ensureDeskDependencies 检查 bot 的 package.json，
// 将模板 package.json 中的依赖合并进去（不覆盖已有的）。
func ensureDeskDependencies(botPath string) (bool, error) {
	botPkgPath := filepath.Join(botPath, "package.json")
	tmplPkgPath := filepath.Join(paths.GetBotTemplate(), "package.json")

	// 读取模板 package.json
	tmplData, err := os.ReadFile(tmplPkgPath)
	if err != nil {
		return false, err
	}
	var tmplPkg map[string]interface{}
	if err := json.Unmarshal(tmplData, &tmplPkg); err != nil {
		return false, err
	}

	// 读取 bot package.json，不存在则从模板复制
	botData, err := os.ReadFile(botPkgPath)
	if err != nil {
		if os.IsNotExist(err) {
			// 直接复制模板 package.json
			if err := os.WriteFile(botPkgPath, tmplData, 0644); err != nil {
				return false, err
			}
			return true, nil
		}
		return false, err
	}
	var botPkg map[string]interface{}
	if err := json.Unmarshal(botData, &botPkg); err != nil {
		return false, err
	}

	tmplDeps, _ := tmplPkg["dependencies"].(map[string]interface{})
	botDeps, _ := botPkg["dependencies"].(map[string]interface{})
	if botDeps == nil {
		botDeps = make(map[string]interface{})
	}

	changed := false
	for k, v := range tmplDeps {
		if _, exists := botDeps[k]; !exists {
			botDeps[k] = v
			changed = true
		}
	}

	if changed {
		botPkg["dependencies"] = botDeps
		out, err := json.MarshalIndent(botPkg, "", "  ")
		if err != nil {
			return false, err
		}
		if err := os.WriteFile(botPkgPath, out, 0644); err != nil {
			return false, err
		}
	}
	return changed, nil
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
