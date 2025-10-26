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

	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
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

	// Create application with options
	err = wails.Run(&options.App{
		Title:  "LearnWails",
		Width:  1024,
		Height: 768,
		Debug: options.Debug{
			// 启用开发者工具
			OpenInspectorOnStartup: os.Getenv("WAILS_DEV") == "true",
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Frameless: true,
		// BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
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
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
