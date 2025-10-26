package main

import (
	files "alemonapp/src/files"
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
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed all:resources
var ResourcesFiles embed.FS

func main() {
	// 加载 .env 文件
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// 初始化文件资源
	files.Create(ResourcesFiles)

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
		Title:  "LearnWails",
		Width:  1024,
		Height: 768,
		Debug: options.Debug{
			OpenInspectorOnStartup: os.Getenv("WAILS_DEV") == "true",
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Frameless: false, // 关键：不使用无边框
		OnStartup: func(ctx context.Context) {
			wbot.Startup(ctx)
			wapp.Startup(ctx)
			wtheme.Startup(ctx)
			wcontroller.Startup(ctx)
			wexpansions.Startup(ctx)
			wyarn.Startup(ctx)
			wgit.Startup(ctx)
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
	}

	// macOS 特定配置 - 启用原生标题栏和交通灯按钮
	if runtime.GOOS == "darwin" {
		appOptions.Mac = &mac.Options{
			TitleBar: &mac.TitleBar{
				TitlebarAppearsTransparent: true,  // 标题栏透明
				HideTitle:                  false, // 显示标题
				HideTitleBar:               false, // 显示标题栏
				FullSizeContent:            false, // 不使用全尺寸内容
				UseToolbar:                 false, // 不使用工具栏
				HideToolbarSeparator:       true,  // 隐藏工具栏分隔符
			},
			Appearance:           mac.DefaultAppearance, // 系统外观
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			About: &mac.AboutInfo{
				Title:   "LearnWails",
				Message: "基于 Wails 构建的应用",
				Icon:    nil,
			},
		}
	}

	err = wails.Run(appOptions)
	if err != nil {
		println("Error:", err.Error())
	}
}
