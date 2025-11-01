// logger/logger.go
package logger

import (
	"alemonapp/src/config"
	"alemonapp/src/paths"
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"sync"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

var (
	curCtx context.Context
	ctxMu  sync.RWMutex
)

func Startup(ctx context.Context) {
	ctxMu.Lock()
	defer ctxMu.Unlock()
	curCtx = ctx
}

var (
	logFile  *os.File
	logger   *log.Logger
	loggerMu sync.RWMutex
)

func GetLogsFilePath() (string, error) {
	logDir := paths.GetLogsPath()
	err := os.MkdirAll(logDir, 0755)
	if err != nil {
		return "", err
	}
	logPath := filepath.Join(logDir, "alemon-desk.log")
	return logPath, nil
}

func Init() error {
	loggerMu.Lock()
	defer loggerMu.Unlock()
	
	// 关闭旧的日志文件，防止资源泄漏
	if logFile != nil {
		_ = logFile.Close()
		logFile = nil
		logger = nil
	}
	
	logPath, err := GetLogsFilePath()
	if err != nil {
		return err
	}

	// 创建日志文件
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return err
	}

	logFile = file
	logger = log.New(file, "", log.LstdFlags|log.Lshortfile)

	return nil
}

func GetLogFilePath() string {
	loggerMu.RLock()
	defer loggerMu.RUnlock()
	
	if logFile != nil {
		return logFile.Name()
	}
	return ""
}

func Info(format string, v ...interface{}) {
	output("INFO", format, v...)
}

func Warn(format string, v ...interface{}) {
	output("WARN", format, v...)
}

func Error(format string, v ...interface{}) {
	output("ERROR", format, v...)
}

func Debug(format string, v ...interface{}) {
	output("DEBUG", format, v...)
}

func output(name string, format string, v ...interface{}) {
	// 不是开发模式下，忽略 DEBUG 日志
	if !config.IsDev() && name == "DEBUG" {
		return
	}
	msg := fmt.Sprintf("["+name+"] "+format, v...)
	
	// 获取调用者信息
	_, file, line, _ := runtime.Caller(2)
	file = filepath.Base(file)

	// 获取 logger 的副本，避免长时间持有锁
	loggerMu.RLock()
	l := logger
	loggerMu.RUnlock()

	// 输出到文件（始终执行）
	if l != nil {
		l.Printf("%s:%d %s", file, line, msg)
	}

	// 同时在控制台输出（开发模式）
	if config.IsDev() {
		log.Printf("%s:%d %s", file, line, msg)
	}

	// 如果有前端上下文，发送到前端
	ctxMu.RLock()
	ctx := curCtx
	ctxMu.RUnlock()
	
	if ctx != nil {
		wailsRuntime.EventsEmit(ctx, "terminal", fmt.Sprintf("%s\n", msg))
	}
}

func Close() error {
	loggerMu.Lock()
	defer loggerMu.Unlock()
	
	if logFile != nil {
		err := logFile.Close()
		logFile = nil
		logger = nil
		return err
	}
	return nil
}

type LogWriter struct {
	Level string
}

func (lw *LogWriter) Write(p []byte) (n int, err error) {
	msg := string(p)
	switch lw.Level {
	case "info":
		Info("%s", msg)
	case "error":
		Error("%s", msg)
	case "debug":
		Debug("%s", msg)
	case "warn":
		Warn("%s", msg)
	default:
		Info("%s", msg)
	}
	return len(p), nil
}
