package windowapp

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
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

// GetConfig 获取配置
func (a *App) AppGetConfig(KEY []string) (interface{}, error) {
	// 实现从配置文件读取逻辑
	// 示例：从 JSON 文件读取配置
	configFile := "config.json"
	data, err := os.ReadFile(configFile)
	if err != nil {
		return nil, err
	}

	var config map[string]interface{}
	err = json.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}
	// 获取指定键的值
	var result interface{} = config
	for _, key := range KEY {
		if m, ok := result.(map[string]interface{}); ok {
			result = m[key]
		} else {
			return nil, nil
		}
	}

	return result, nil

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

// ResetTemplate 重置模板
func (a *App) AppResetTemplate() error {
	// 实现模板重置逻辑
	templateDir := "templates"

	// 删除模板目录
	err := os.RemoveAll(templateDir)
	if err != nil {
		return err
	}

	// 重新创建默认模板
	err = os.MkdirAll(templateDir, 0755)
	if err != nil {
		return err
	}

	// 这里可以添加创建默认模板文件的逻辑
	defaultTemplate := []byte("<!-- 默认模板 -->")
	err = os.WriteFile(filepath.Join(templateDir, "default.html"), defaultTemplate, 0644)
	if err != nil {
		return err
	}

	return nil
}

// Fetch 发送 HTTP 请求
func (a *App) AppFetch(url string, options map[string]interface{}) (map[string]interface{}, error) {
	// 创建 HTTP 客户端
	client := &http.Client{}

	// 创建请求
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	// 设置请求头
	if headers, ok := options["headers"].(map[string]interface{}); ok {
		for key, value := range headers {
			if strValue, ok := value.(string); ok {
				req.Header.Set(key, strValue)
			}
		}
	}

	// 发送请求
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// 返回响应
	result := map[string]interface{}{
		"status":     resp.StatusCode,
		"statusText": resp.Status,
		"headers":    resp.Header,
		"body":       string(body),
	}

	return result, nil
}

// SelectDirectory 选择目录
func (a *App) AppSelectDirectory() (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择目录",
	})
	if err != nil {
		return "", err
	}
	return dir, nil
}

// ReStart 重启应用
func (a *App) AppReStart() error {
	// 重启逻辑
	runtime.Quit(a.ctx)
	// 注意：实际重启需要额外的逻辑，这里只是退出
	return nil
}
