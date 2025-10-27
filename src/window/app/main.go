package windowapp

import (
	"alemonapp/src/config"
	"alemonapp/src/paths"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

const AUTO_LAUNCH = ""
const APP_PATH = ""
const AUTO_INSTALL = ""
const AUTO_RUN_EXTENSION = ""

type PathsState struct {
	UserDataTemplatePath    string `json:"userDataTemplatePath"`
	UserDataNodeModulesPath string `json:"userDataNodeModulesPath"`
	UserDataPackagePath     string `json:"userDataPackagePath"`
	PreloadPath             string `json:"preloadPath"`
	LogMainPath             string `json:"logMainPath"`
}

func (a *App) AppGetPathsState() PathsState {
	return PathsState{
		UserDataTemplatePath:    paths.CreateBotPath(config.BotName),
		UserDataNodeModulesPath: paths.GetBotDependencyPath(config.BotName),
		UserDataPackagePath:     paths.GetBotPackageJsonFilePath(config.BotName),
		PreloadPath:             "",
		LogMainPath:             "",
	}
}

// GetConfig 获取配置
func (a *App) AppGetConfig(KEY []string) ([]string, error) {
	data := []string{}
	for _, k := range KEY {
		if k == "AUTO_LAUNCH" {
			data = append(data, AUTO_LAUNCH)
		}
		if k == "APP_PATH" {
			data = append(data, APP_PATH)
		}
		if k == "AUTO_INSTALL" {
			data = append(data, AUTO_INSTALL)
		}
		if k == "AUTO_RUN_EXTENSION" {
			data = append(data, AUTO_RUN_EXTENSION)
		}
	}
	return data, nil
}

// SetConfig 设置配置
func (a *App) AppSetConfig(KEY string, value interface{}) (bool, error) {
	// 实现配置保存逻辑
	configFile := "config.json"

	// 读取现有配置
	var config map[string]interface{}
	data, err := os.ReadFile(configFile)
	if err == nil {
		json.Unmarshal(data, &config)
	} else {
		config = make(map[string]interface{})
	}

	// 更新配置
	config[KEY] = value

	// 写回文件
	newData, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return false, err
	}

	err = os.WriteFile(configFile, newData, 0644)
	if err != nil {
		return false, err
	}

	return true, nil
}

// ReadFiles 读取文件
func (a *App) AppReadFiles(dir string) (string, error) {
	data, err := os.ReadFile(dir)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// WriteFiles 写入文件
func (a *App) AppWriteFiles(dir string, data string) (string, error) {
	// 确保目录存在
	dirPath := filepath.Dir(dir)
	err := os.MkdirAll(dirPath, 0755)
	if err != nil {
		return "", err
	}

	err = os.WriteFile(dir, []byte(data), 0644)
	if err != nil {
		return "", err
	}

	return "文件写入成功", nil
}

// Exists 检查文件或目录是否存在
func (a *App) AppExists(dir string) (bool, error) {
	_, err := os.Stat(dir)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

// DownloadFiles 下载文件
func (a *App) AppDownloadFiles(url string) error {
	// 实现文件下载逻辑
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// 从 URL 提取文件名
	filename := filepath.Base(url)
	if filename == "." || filename == "/" {
		filename = "download.file"
	}

	// 创建文件
	out, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer out.Close()

	// 写入文件
	_, err = io.Copy(out, resp.Body)
	return err
}
