package logicyarn

import (
	"alemonapp/src/files"
	"alemonapp/src/logger"
	logicbot "alemonapp/src/logic/bot"
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

// 加载依赖
func Add(name string, args []string) (bool, error) {
	manager := files.GetNodeJSManager()
	nodeDir, err := manager.GetNodeExePath()

	// 检查系统是否安装了 Node.js
	if err != nil {
		return false, err
	}

	// 检查机器人是否正在运行
	if logicbot.IsRunning(name) {
		return false, os.ErrExist
	}

	// 检查是否提供了依赖名称
	if len(args) == 0 {
		return false, os.ErrInvalid
	}

	// yarn.cjs 路径
	cliDir := paths.GetNodeYarnScriptFilePath()
	botPath := paths.CreateBotPath(name)

	// 构建命令参数
	curArgs := append([]string{cliDir, "add", "-W"}, args...)
	
	// 在 Windows 上添加额外的参数
	if runtime.GOOS == "windows" {
		curArgs = append(curArgs, "--mutex", "file")
	}

	// 创建命令工厂函数
	cmdFactory := func() *exec.Cmd {
		cmd := utils.Command(nodeDir, curArgs...)
		cmd.Dir = botPath
		cmd.Stdout = &logger.LogWriter{Level: "info"}
		cmd.Stderr = &logger.LogWriter{Level: "error"}
		return cmd
	}

	// 使用重试机制执行命令
	if err := runYarnCommandWithRetry(cmdFactory); err != nil {
		return false, err
	}

	return true, nil
}

// 加载依赖
func Install(name string) (bool, error) {
	manager := files.GetNodeJSManager()
	nodeDir, err := manager.GetNodeExePath()
	// 检查系统是否安装了 Node.js
	if err != nil {
		logger.Error("unable to find node:", err)
		return false, err
	}
	if logicbot.IsRunning(name) {
		logger.Warn("机器人在运行中，禁止调整依赖")
		return false, os.ErrExist
	}

	// yarn.cjs
	cliDir := paths.GetNodeYarnScriptFilePath()
	botPath := paths.CreateBotPath(name)

	// 构建 yarn install 参数
	args := []string{cliDir, "install", "--ignore-engines", "--network-concurrency", "1"}

	// 在 Windows 上添加额外的参数来减少文件锁定问题
	if runtime.GOOS == "windows" {
		args = append(args, "--mutex", "file")
	}

	// 创建命令工厂函数
	cmdFactory := func() *exec.Cmd {
		cmd := utils.Command(nodeDir, args...)
		cmd.Dir = botPath
		cmd.Stdout = &logger.LogWriter{Level: "info"}
		cmd.Stderr = &logger.LogWriter{Level: "error"}
		return cmd
	}

	// 使用重试机制执行命令
	if err := runYarnCommandWithRetry(cmdFactory); err != nil {
		// 分析错误。如果只是依赖的一些警告不应当做为错误
		if exitError, ok := err.(*exec.ExitError); ok && exitError.ExitCode() == 0 {
			logger.Error("依赖安装完成，存在警告信息")
			return false, nil
		}
		logger.Error("依赖安装失败:", err)
		return false, err
	}
	return true, nil
}

// 移除依赖
func Remove(name string, names []string) (bool, error) {
	manager := files.GetNodeJSManager()
	nodeDir, err := manager.GetNodeExePath()

	// 检查系统是否安装了 Node.js
	if err != nil {
		return false, err
	}

	// 检查是否提供了依赖名称
	if len(names) == 0 {
		return false, os.ErrInvalid
	}

	// 检查机器人是否正在运行
	if logicbot.IsRunning(name) {
		return false, os.ErrExist
	}

	// yarn.cjs 路径
	cliDir := paths.GetNodeYarnScriptFilePath()
	botPath := paths.CreateBotPath(name)

	// 构建命令参数
	args := append([]string{cliDir, "remove", "-W"}, names...)
	
	// 在 Windows 上添加额外的参数
	if runtime.GOOS == "windows" {
		args = append(args, "--mutex", "file")
	}

	// 创建命令工厂函数
	cmdFactory := func() *exec.Cmd {
		cmd := utils.Command(nodeDir, args...)
		cmd.Dir = botPath
		cmd.Stdout = &logger.LogWriter{Level: "info"}
		cmd.Stderr = &logger.LogWriter{Level: "error"}
		return cmd
	}

	// 使用重试机制执行命令
	if err := runYarnCommandWithRetry(cmdFactory); err != nil {
		return false, err
	}

	return true, nil
}

// 自由 cmd
func Cmd(name string, args []string) (bool, error) {
	manager := files.GetNodeJSManager()
	nodeDir, err := manager.GetNodeExePath()

	// 检查系统是否安装了 Node.js
	if err != nil {
		return false, err
	}

	// 检查机器人是否正在运行
	if logicbot.IsRunning(name) {
		return false, os.ErrExist
	}

	// 检查是否提供了命令参数
	if len(args) == 0 {
		return false, os.ErrInvalid
	}

	// yarn.cjs 路径
	cliDir := paths.GetNodeYarnScriptFilePath()
	botPath := paths.CreateBotPath(name)

	// 构建命令参数
	cmdArgs := append([]string{cliDir}, args...)
	
	// 在 Windows 上添加额外的参数（如果还没有 mutex 参数）
	hasMutex := false
	for _, arg := range args {
		if arg == "--mutex" {
			hasMutex = true
			break
		}
	}
	if runtime.GOOS == "windows" && !hasMutex {
		cmdArgs = append(cmdArgs, "--mutex", "file")
	}

	// 创建命令工厂函数
	cmdFactory := func() *exec.Cmd {
		cmd := utils.Command(nodeDir, cmdArgs...)
		cmd.Dir = botPath
		cmd.Stdout = &logger.LogWriter{Level: "info"}
		cmd.Stderr = &logger.LogWriter{Level: "error"}
		return cmd
	}

	// 使用重试机制执行命令
	if err := runYarnCommandWithRetry(cmdFactory); err != nil {
		return false, err
	}

	return true, nil
}

// runYarnCommandWithRetry 执行 yarn 命令，支持 Windows 上的重试机制
// cmdFactory 是一个返回新命令的函数，因为 cmd.Run() 只能执行一次
func runYarnCommandWithRetry(cmdFactory func() *exec.Cmd) error {
	maxRetries := 3
	retryDelay := time.Second * 2

	var lastErr error
	var lastStderr string

	for i := 0; i < maxRetries; i++ {
		cmd := cmdFactory()

		// 捕获 stderr 以便检查错误信息
		var stderrBuf strings.Builder
		if cmd.Stderr != nil {
			// 如果已经设置了 Stderr，我们需要使用 MultiWriter
			cmd.Stderr = &logger.LogWriter{Level: "error"}
		}

		err := cmd.Run()
		lastErr = err
		lastStderr = stderrBuf.String()

		if err == nil {
			return nil
		}

		// 检查是否是 Windows 文件锁定错误
		if runtime.GOOS == "windows" {
			errMsg := err.Error() + " " + lastStderr
			isLockError := strings.Contains(errMsg, "EBUSY") ||
				strings.Contains(errMsg, "resource busy") ||
				strings.Contains(errMsg, "locked") ||
				strings.Contains(errMsg, "EPERM")

			if isLockError && i < maxRetries-1 {
				logger.Warn("检测到文件锁定错误，%d秒后重试 (%d/%d)", int(retryDelay.Seconds()), i+1, maxRetries)
				time.Sleep(retryDelay)
				continue
			}

			if isLockError && i == maxRetries-1 {
				logger.Error("文件锁定错误，已重试%d次仍然失败。", maxRetries)
				logger.Error("建议解决方案：")
				logger.Error("  1. 暂时关闭防病毒软件（Windows Defender 或其他杀毒软件）")
				logger.Error("  2. 关闭文件管理器和其他可能占用文件的程序")
				logger.Error("  3. 以管理员身份运行应用")
				logger.Error("  4. 等待几分钟后重试")
			}
		}

		// 对于非锁定错误，不重试
		if i == 0 && runtime.GOOS != "windows" {
			return lastErr
		}

		// 非 Windows 系统或非锁定错误，直接返回
		if runtime.GOOS != "windows" {
			return lastErr
		}
	}

	return lastErr
}
