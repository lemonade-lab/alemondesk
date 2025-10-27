package windowapp

import (
	"alemonapp/src/config"
	"alemonapp/src/paths"
	"context"
	"encoding/json"
	"log"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
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

// SetConfig 设置配置
func (a *App) AppSetConfig(KEY string, value interface{}) (bool, error) {
	// 实现配置保存逻辑
	configFile := paths.GetAppConfigPath()

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

// GetConfig 获取配置
func (a *App) AppGetConfig(KEY []string) (map[string]interface{}, error) {
	// 实现配置读取逻辑
	configFile := paths.GetAppConfigPath()

	// 读取配置文件
	data, err := os.ReadFile(configFile)
	if err != nil {
		return nil, err
	}

	var config map[string]interface{}
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	// 提取所需键值
	result := make(map[string]interface{})
	for _, key := range KEY {
		if value, exists := config[key]; exists {
			result[key] = value
		}
	}

	return result, nil
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

	log.Println("Writing to file:", dir, data)

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
func (a *App) AppDownloadFiles(localURL string) error {
	content, err := os.ReadFile(localURL)
	if err != nil {
		return err
	}

	DisplayName := filepath.Base(localURL)
	Pattern := "*." + filepath.Ext(localURL)[1:]

	// 弹出保存文件对话框
	savePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title: "保存文件",
		Filters: []runtime.FileFilter{
			{
				DisplayName: DisplayName,
				Pattern:     Pattern,
			},
		},
	})
	if err != nil || savePath == "" {
		return err
	}

	// 写入文件
	return os.WriteFile(savePath, []byte(content), 0644)
}
