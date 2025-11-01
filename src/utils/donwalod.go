package utils

import (
	"context"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// DownloadFiles 下载文件
func DownloadFiles(ctx context.Context, localURL string) error {
	content, err := os.ReadFile(localURL)
	if err != nil {
		return err
	}

	DisplayName := filepath.Base(localURL)
	Pattern := "*." + filepath.Ext(localURL)[1:]

	// 弹出保存文件对话框
	savePath, err := runtime.SaveFileDialog(ctx, runtime.SaveDialogOptions{
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
