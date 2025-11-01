package main

import (
	assetServer "alemonapp/src/assetServer"
	config "alemonapp/src/config"
	files "alemonapp/src/files"
	logger "alemonapp/src/logger"
	paths "alemonapp/src/paths"
	utils "alemonapp/src/utils"
	windowapp "alemonapp/src/window/app"
	windowbot "alemonapp/src/window/bot"
	windowcontroller "alemonapp/src/window/controller"
	windowexpansions "alemonapp/src/window/expansions"
	windowgit "alemonapp/src/window/git"
	windowtheme "alemonapp/src/window/theme"
	windowyarn "alemonapp/src/window/yarn"
	"context"
	"embed"
	"log"
	"os"
	"runtime"

	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2"

	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed resources/**/* resources/*
var ResourcesFiles embed.FS

func main() {
	// 加载.env
	_ = godotenv.Load()

	// 初始化日志
	if err := logger.Init(); err != nil {
		// logger 未初始化，直接输出到标准错误并退出
		log.Printf("[FATAL] 初始化日志失败: %v\n", err)
		os.Exit(1)
	}
	// 程序退出时关闭日志
	defer logger.Close()

	// 从嵌入里解出文件
	files.Create(ResourcesFiles)

	// 判断系统是否有 Node.js
	_, err := files.GetSystemExePath()
	// 不存在的话解压 Node.js
	if err != nil {
		logger.Info("系统未找到 Node.js，开始解压内置 Node.js")
		if extractErr := files.ExtractNodeJS(); extractErr != nil {
			logger.Error("解压 Node.js 失败: %v，将尝试使用系统 Node.js", extractErr)
		} else {
			logger.Info("Node.js 解压成功")
		}
	}

	// 检查 Node.js 安装
	manager := files.GetNodeJSManager()
	nodePath, err := manager.GetNodeExePath()
	if err != nil {
		logger.Error("获取 Node.js 路径失败: %v，某些功能可能无法正常使用", err)
	} else {
		logger.Info("Node.js 路径: %s", nodePath)
	}

	// 不存在的时候创建机器人目录
	botPath := paths.CreateBotPath(config.BotName)
	if _, err := os.Stat(botPath); os.IsNotExist(err) {
		logger.Info("机器人目录不存在，开始创建: %s", botPath)
		if copyErr := utils.CopyDir(paths.GetBotTemplate(), botPath); copyErr != nil {
			logger.Error("创建机器人目录失败: %v", copyErr)
		} else {
			logger.Info("机器人目录创建成功")
		}
	}

	// Create an instance of the app structure
	wbot := windowbot.NewApp()
	wapp := windowapp.NewApp()
	wtheme := windowtheme.NewApp()
	wcontroller := windowcontroller.NewApp()
	wexpansions := windowexpansions.NewApp()
	wyarn := windowyarn.NewApp()
	wgit := windowgit.NewApp()

	// 创建应用选项
	appOptions := &options.App{
		Title:             "ALemonDesk",
		MaxWidth:          1400,
		MaxHeight:         900,
		Width:             960,
		Height:            600,
		MinWidth:          960,
		MinHeight:         600,
		HideWindowOnClose: false, // 关闭窗口时隐藏应用
		Debug: options.Debug{
			OpenInspectorOnStartup: false,
		},
		AssetServer: assetServer.CreateAssetServer(&assets),
		// Macos 禁止无边框窗口
		Frameless: runtime.GOOS != "darwin",
		OnStartup: func(ctx context.Context) {
			wgit.Startup(ctx)
			wbot.Startup(ctx)
			wapp.Startup(ctx)
			wtheme.Startup(ctx)
			wcontroller.Startup(ctx)
			wexpansions.Startup(ctx)
			wyarn.Startup(ctx)
			logger.Startup(ctx)
		},
		Bind: []interface{}{
			wbot,
			wapp,
			wtheme,
			wcontroller,
			wexpansions,
			wyarn,
			wgit,
		},
		// Windows: options.Windows{
		// 	wexpansions.CreateHideWebview()
		// },
	}

	// macOS 特定配置 - 启用交通灯按钮
	if runtime.GOOS == "darwin" {
		appOptions.Mac = &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,  // 标题栏透明
				HideTitle:                  true,  // 隐藏标题
				HideTitleBar:               false, // 显示标题栏
				FullSizeContent:            false, // 不使用全尺寸内容
				UseToolbar:                 false, // 不使用工具栏
				HideToolbarSeparator:       true,  // 隐藏工具栏分隔符
			},
			Appearance:           mac.DefaultAppearance, // 系统外观
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
		}
	}

	if err := wails.Run(appOptions); err != nil {
		logger.Error("Error:", err.Error())
	}

}
