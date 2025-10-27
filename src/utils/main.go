package utils

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"
)

// CopyDir 复制目录下的所有文件到目标目录
func CopyDir(src, dest string) error {
	err := ClearFolder(dest)
	if err != nil {
		return fmt.Errorf("clearFolder: %w", err)
	}
	err = CopyFolder(src, dest)
	if err != nil {
		return fmt.Errorf("copyFolder: %w", err)
	}
	return nil
}

func CopyFolder(src, dest string) error {
	err := os.MkdirAll(dest, os.ModePerm)
	if err != nil {
		return err
	}
	entries, err := os.ReadDir(src)
	if err != nil {
		return fmt.Errorf("read dir %s failed: %w", src, err)
	}
	for _, entry := range entries {
		sourcePath := path.Join(src, entry.Name())
		targetPath := path.Join(dest, entry.Name())
		if entry.Name() == "logs" || entry.Name() == "log" {
			continue
		}
		if entry.IsDir() {
			err = CopyFolder(sourcePath, targetPath)
			if err != nil {
				return fmt.Errorf("copy folder failed: %w", err)
			}
		} else {
			err = CopyFile(sourcePath, targetPath)
			if err != nil {
				return fmt.Errorf("copy file failed: %w", err)
			}
		}
	}
	return nil
}

func CopyFile(src, dest string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("open source file: %w", err)
	}
	defer sourceFile.Close()
	destFile, err := os.Create(dest)
	if err != nil {
		return fmt.Errorf("create file %s failed: %w", dest, err)
	}
	defer destFile.Close()
	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return fmt.Errorf("copy file %s to %s failed: %w", src, dest, err)
	}

	srcInfo, err := os.Stat(src)
	if err != nil {
		return fmt.Errorf("stat file %s failed: %w", src, err)
	}
	err = os.Chmod(dest, srcInfo.Mode())
	if err != nil {
		return fmt.Errorf("chmod fail: %w", err)
	}
	return destFile.Sync()
}

func ClearFolder(targetPath string) error {
	entries, err := os.ReadDir(targetPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("read dir fail: %w", err)
	}
	for _, entry := range entries {
		entryPath := path.Join(targetPath, entry.Name())
		if entry.Name() == "logs" || entry.Name() == "log" {
			continue
		}
		err := os.RemoveAll(entryPath)
		if err != nil {
			return fmt.Errorf("删除文件失败: %w", err)
		}
	}
	return nil
}

// Command 创建一个新的命令
func Command(name string, arg ...string) *exec.Cmd {
	cmd := exec.Command(name, arg...)
	cmd.Env = os.Environ()
	return cmd
}

func ExistsPath(path []string) bool {
	for _, p := range path {
		_, err := os.Stat(p)
		if os.IsNotExist(err) {
			return false
		}
	}
	return true
}
