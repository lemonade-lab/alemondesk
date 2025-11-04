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
	"embed"
	"fmt"
	"log"
	"os"
	"path"
	"runtime"

	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed resources/**/* resources/*
var ResourcesFiles embed.FS

type SysImg struct{}

//go:embed images/*
var ImgFs embed.FS

func NewImgVendor() *SysImg {
	return &SysImg{}
}

func (s *SysImg) GetImg(fileName string) ([]byte, error) {
	trayIcon, err := ImgFs.ReadFile(path.Join("images", fileName))
	if err != nil {
		fmt.Println("找不到图片文件：", err.Error())
		return nil, err
	}
	return trayIcon, nil
}

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
	wBot := windowbot.NewApp()
	wApp := windowapp.NewApp()
	wTheme := windowtheme.NewApp()
	wController := windowcontroller.NewApp()
	wExpansions := windowexpansions.NewApp()
	wYarn := windowyarn.NewApp()
	wGit := windowgit.NewApp()

	// 创建应用
	app := application.New(application.Options{
		Name:        "ALemonDesk",
		Description: "ALemon Desktop Application",
		Services: []application.Service{
			application.NewService(wBot),
			application.NewService(wApp),
			application.NewService(wTheme),
			application.NewService(wController),
			application.NewService(wExpansions),
			application.NewService(wYarn),
			application.NewService(wGit),
		},
		Assets: assetServer.CreateAssetServer(&assets),
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// 设置窗口关闭行为
	// mainWindow.On(events.Common.WindowClosing, func(e *application.WindowEvent) {
	// // 可以在这里添加关闭前的清理逻辑
	// logger.Info("应用程序正在关闭")
	// })

	windowOptions := application.WebviewWindowOptions{
		Title:            "ALemonDesk",
		Width:            960,
		Height:           600,
		MinWidth:         960,
		MinHeight:        600,
		MaxWidth:         1400,
		MaxHeight:        900,
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
		Frameless:        runtime.GOOS != "darwin",
		Mac: application.MacWindow{
			Backdrop: application.MacBackdropTranslucent,
			TitleBar: application.MacTitleBarHidden,
			// InvisibleTitleBarHeight: 28,
		},
	}

	// 创建主窗口
	// app.Window.NewWithOptions(windowOptions)
	window := app.Window.NewWithOptions(windowOptions)

	sysImg := NewImgVendor()
	icon, _ := sysImg.GetImg("appicon.png")
	systray := app.SystemTray.New()
	systray.SetIcon(icon)
	systray.SetTooltip("ALemonDesk")
	menu := application.NewMenu()

	systray.OnClick(func() {
		if !window.IsVisible() {
			window.Show()
			return
		}
		window.Focus()
	})

	menu.Add("退出").OnClick(func(ctx *application.Context) {
		app.Quit()
	})

	systray.SetMenu(menu)

	// 启动服务
	ctx := app.Context()

	wGit.Startup(ctx)
	wGit.SetApplication(app.Event)
	wBot.Startup(ctx)
	wBot.SetApplication(app.Event)
	wApp.Startup(ctx)
	wApp.SetApplication(app.Event)
	wApp.SetWindow(window)
	wTheme.Startup(ctx)
	wTheme.SetApplication(app.Event)
	wController.Startup(ctx)
	wController.SetApplication(app.Event)
	wExpansions.Startup(ctx)
	wExpansions.SetApplication(app.Event)
	wYarn.Startup(ctx)
	wYarn.SetApplication(app.Event)

	// set logger application
	logger.SetApplication(app.Event)

	// 运行应用
	if err := app.Run(); err != nil {
		logger.Error("应用程序运行错误: %v", err)
		return
	}
}
