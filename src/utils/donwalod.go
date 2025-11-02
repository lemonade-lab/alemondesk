package utils

import (
	"os"
	"path/filepath"

	application "github.com/wailsapp/wails/v3/pkg/application"
)

// DownloadFiles 下载文件
func DownloadFiles(localURL string) error {
	content, err := os.ReadFile(localURL)
	if err != nil {
		return err
	}
	DisplayName := filepath.Base(localURL)
	Pattern := "*" + filepath.Ext(localURL)

	// 使用应用级别的保存文件对话框
	dialog := application.SaveFileDialog()

	options := &application.SaveFileDialogOptions{
		Filename: DisplayName,
		Title:    "保存文件",
		Filters: []application.FileFilter{
			{
				DisplayName: DisplayName,
				Pattern:     Pattern,
			},
		},
	}
	dialog.SetOptions(options)

	savePath, err := dialog.PromptForSingleSelection()

	if err != nil {
		return err
	}
	if savePath == "" {
		return nil // 用户取消保存
	}
	// 写入文件
	return os.WriteFile(savePath, content, 0644)
}
