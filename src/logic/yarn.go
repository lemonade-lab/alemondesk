package logic

import (
	"alemonapp/src/paths"
	"alemonapp/src/utils"
	"log"
	"os"
	"os/exec"
)

// 加载依赖
func Add(name string, args []string) (bool, error) {
	// 检查系统是否安装了 Node.js
	if _, err := exec.LookPath("node"); err != nil {
		return false, err
	}

	// 检查机器人是否正在运行
	if IsRunning(name) {
		return false, os.ErrExist
	}

	// 检查是否提供了依赖名称
	if len(args) == 0 {
		return false, os.ErrInvalid
	}

	// 检查机器人是否正在运行
	if IsRunning(name) {
		return false, os.ErrExist
	}

	// 检查是否提供了依赖名称
	if len(args) == 0 {
		return false, os.ErrInvalid
	}

	// yarn.cjs 路径
	cliDir := paths.GetNodeYarnScriptFilePath()

	// 构建命令
	curArgs := append([]string{"add", "-W"}, args...)
	cmd := utils.Command("node", append([]string{cliDir}, curArgs...)...)

	// 设置工作目录为机器人的路径
	cmd.Dir = paths.CreateBotPath(name)

	// confLogLevel := os.Getenv("APP_LOG_LEVEL")
	// var l = new(zapcore.Level)
	// if err := l.UnmarshalText([]byte(confLogLevel)); err != nil {
	// 	fmt.Printf("unable to unmarshal zapcore.Level: %v\n", err)
	// }

	// botLogger, err := logger.GetOrCreateBotLogger(name, *l)
	// if err != nil {
	// 	fmt.Printf("unable to create logger: %v\n", err)
	// }
	// botLoggerWriter := logger.NewRobotLoggerWriter(botLogger)

	//defer botLoggerWriter.RobotLogger.Close()

	// 设置命令的输出到日志文件
	// cmd.Stdout = botLoggerWriter.Writer(logger.WriterOption{
	// 	DetectLevel: false,
	// 	StripDate:   false,
	// 	StripLevel:  false,
	// })
	// cmd.Stderr = botLoggerWriter.Writer(logger.WriterOption{
	// 	DetectLevel: false,
	// 	StripDate:   false,
	// 	StripLevel:  false,
	// })

	// 执行命令
	if err := cmd.Run(); err != nil {
		return false, err
	}

	return true, nil
}

// 加载依赖
func Install(name string) (bool, error) {
	// 检查系统是否安装了 Node.js
	if _, err := exec.LookPath("node"); err != nil {
		log.Println("unable to find node:", err)
		return false, err
	}
	if IsRunning(name) {
		log.Println("机器人在运行")
		return false, os.ErrExist
	}
	// yarn.cjs
	cliDir := paths.GetNodeYarnScriptFilePath()
	// yarn install
	cmd := utils.Command("node", cliDir, "install", "--ignore-engines")
	// 设置工作目录为机器人的路径
	cmd.Dir = paths.CreateBotPath(name)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	// var l = new(zapcore.Level)
	// confLogLevel := os.Getenv("APP_LOG_LEVEL")
	// if err := l.UnmarshalText([]byte(confLogLevel)); err != nil {
	// 	fmt.Printf("unable to unmarshal zapcore.Level: %v\n", err)
	// }

	// botLogger, err := logger.GetOrCreateBotLogger(name, *l)
	// if err != nil {
	// 	fmt.Printf("unable to create logger: %v\n", err)
	// }
	// botLoggerWriter := logger.NewRobotLoggerWriter(botLogger)

	// cmd.Stdout = botLoggerWriter.Writer(logger.WriterOption{
	// 	DetectLevel: false,
	// 	StripDate:   false,
	// 	StripLevel:  false,
	// })
	// cmd.Stderr = botLoggerWriter.Writer(logger.WriterOption{
	// 	DetectLevel: false,
	// 	StripDate:   false,
	// 	StripLevel:  false,
	// })

	//defer botLoggerWriter.RobotLogger.Close()

	// 执行命令
	if err := cmd.Run(); err != nil {
		// 分析错误。如果只是依赖的一些警告不应当做为错误
		if exitError, ok := err.(*exec.ExitError); ok && exitError.ExitCode() == 0 {
			log.Println("依赖安装完成，存在警告信息")
			return false, nil
		}
		log.Println("依赖安装失败:", err)
		return false, err
	}
	log.Println("依赖安装成功")
	return true, nil
}

// 移除依赖
func Remove(name string, names []string) (bool, error) {
	// 检查系统是否安装了 Node.js
	if _, err := exec.LookPath("node"); err != nil {
		return false, err
	}

	// 检查是否提供了依赖名称
	if len(names) == 0 {
		return false, os.ErrInvalid
	}

	// 检查机器人是否正在运行
	if IsRunning(name) {
		return false, os.ErrExist
	}

	// yarn.cjs 路径
	cliDir := paths.GetNodeYarnScriptFilePath()

	// 构建命令
	args := append([]string{"remove", "-W"}, names...)
	cmd := utils.Command("node", append([]string{cliDir}, args...)...)

	// 设置工作目录为机器人的路径
	cmd.Dir = paths.CreateBotPath(name)

	// var l = new(zapcore.Level)
	// confLogLevel := os.Getenv("APP_LOG_LEVEL")
	// if err := l.UnmarshalText([]byte(confLogLevel)); err != nil {
	// 	fmt.Printf("unable to unmarshal zapcore.Level: %v\n", err)
	// }

	// botLogger, err := logger.GetOrCreateBotLogger(name, *l)
	// if err != nil {
	// 	fmt.Printf("unable to create logger: %v\n", err)
	// }
	// botLoggerWriter := logger.NewRobotLoggerWriter(botLogger)

	// //defer botLoggerWriter.RobotLogger.Close()

	// // 设置命令的输出到日志文件
	// cmd.Stdout = botLoggerWriter.Writer(logger.WriterOption{
	// 	DetectLevel: false,
	// 	StripDate:   false,
	// 	StripLevel:  false,
	// })
	// cmd.Stderr = botLoggerWriter.Writer(logger.WriterOption{
	// 	DetectLevel: false,
	// 	StripDate:   false,
	// 	StripLevel:  false,
	// })

	// 执行命令
	if err := cmd.Run(); err != nil {
		return false, err
	}

	return true, nil
}

// 自由 cmd
func Cmd(name string, args []string) (bool, error) {
	// 检查系统是否安装了 Node.js
	if _, err := exec.LookPath("node"); err != nil {
		return false, err
	}

	// 检查机器人是否正在运行
	if IsRunning(name) {
		return false, os.ErrExist
	}

	// 检查是否提供了命令参数
	if len(args) == 0 {
		return false, os.ErrInvalid
	}

	// yarn.cjs 路径
	cliDir := paths.GetNodeYarnScriptFilePath()

	// 构建命令
	cmd := utils.Command("node", append([]string{cliDir}, args...)...)

	// 设置工作目录为机器人的路径
	cmd.Dir = paths.CreateBotPath(name)
	// var l = new(zapcore.Level)
	// confLogLevel := os.Getenv("APP_LOG_LEVEL")
	// if err := l.UnmarshalText([]byte(confLogLevel)); err != nil {
	// 	fmt.Printf("unable to unmarshal zapcore.Level: %v\n", err)
	// }

	// botLogger, err := logger.GetOrCreateBotLogger(name, *l)
	// if err != nil {
	// 	fmt.Printf("unable to create logger: %v\n", err)
	// }
	// botLoggerWriter := logger.NewRobotLoggerWriter(botLogger)

	// //defer botLoggerWriter.RobotLogger.Close()

	// // 设置命令的输出到日志文件
	// cmd.Stdout = botLoggerWriter.Writer(logger.WriterOption{
	// 	DetectLevel: false,
	// 	StripDate:   false,
	// 	StripLevel:  false,
	// })
	// cmd.Stderr = botLoggerWriter.Writer(logger.WriterOption{
	// 	DetectLevel: false,
	// 	StripDate:   false,
	// 	StripLevel:  false,
	// })

	// 执行命令
	if err := cmd.Run(); err != nil {
		return false, err
	}

	return true, nil
}
