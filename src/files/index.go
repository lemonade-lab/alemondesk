package files

import (
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"io"
	"io/fs"
	"os"
	"path"
)

var resourcesFiles fs.FS

// init 函数用于解压资源
func Create(ResourcesFiles fs.FS) {
	resourcesFiles = ResourcesFiles
	workPAth := paths.GetWorkPath()
	// 解压资源
	err := fs.WalkDir(resourcesFiles, ".", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			logger.Error("资源初始化失败: %v", err)
			return err
		}
		// 计算目标路径
		targetPath := path.Join(workPAth, p)
		// 如果是目录
		if d.IsDir() {
			// 创建目录
			if err := os.MkdirAll(targetPath, os.ModePerm); err != nil {
				logger.Error("资源初始化失败: %v", err)
				return err
			}
		} else {
			// 打开文件
			curFile, err := resourcesFiles.Open(p)
			if err != nil {
				logger.Error("资源初始化失败: %v", err)
				return err
			}
			// 关闭文件
			defer curFile.Close()

			// 打开文件
			file, err := os.Create(targetPath)
			if err != nil {
				logger.Error("资源初始化失败: %v", err)
				return err
			}
			// 关闭文件
			defer file.Close()

			// 复制文件
			if _, err := io.Copy(file, curFile); err != nil {
				logger.Error("资源初始化失败: %v", err)
				return err
			}
		}
		return nil
	})

	if err != nil {
		logger.Info("资源初始化失败:", err)
		return
	}
}
