// logger/logger.go
package logger

import (
	"alemonapp/src/config"
	"alemonapp/src/paths"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
)

var (
	logFile *os.File
	logger  *log.Logger
)

func Init() error {
	// 创建日志目录
	logDir := paths.GetLogsPath()
	os.MkdirAll(logDir, 0755)

	// 创建日志文件
	logPath := filepath.Join(logDir, "alemon-desk.log")
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return err
	}

	logFile = file
	logger = log.New(file, "", log.LstdFlags|log.Lshortfile)

	return nil
}

func Info(format string, v ...interface{}) {
	msg := fmt.Sprintf("[INFO] "+format, v...)
	output(msg)
}

func Error(format string, v ...interface{}) {
	msg := fmt.Sprintf("[ERROR] "+format, v...)
	output(msg)
}

func Debug(format string, v ...interface{}) {
	msg := fmt.Sprintf("[DEBUG] "+format, v...)
	output(msg)
}

func output(msg string) {
	// 获取调用者信息
	_, file, line, _ := runtime.Caller(2)
	file = filepath.Base(file)

	// 输出到文件
	if logger != nil {
		logger.Printf("%s:%d %s", file, line, msg)
	}

	// 同时在控制台输出（开发模式）
	if config.IsDev() {
		log.Printf("%s:%d %s", file, line, msg)
	}
}

func Close() {
	if logFile != nil {
		logFile.Close()
	}
}
