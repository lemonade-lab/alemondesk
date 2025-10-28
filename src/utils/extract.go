package utils

import (
	"archive/tar"
	"archive/zip"
	"compress/bzip2"
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/ulikunitz/xz"
)

// ExtractFileTo 解压文件到目标路径
func ExtractFileTo(srcPath, destPath string) error {
	// 检查源文件是否存在
	if _, err := os.Stat(srcPath); os.IsNotExist(err) {
		return fmt.Errorf("源文件不存在: %s", srcPath)
	}

	// 检查目标路径是否存在，不存在则创建
	if err := os.MkdirAll(destPath, 0755); err != nil {
		return fmt.Errorf("创建目标路径失败: %w", err)
	}

	// 根据文件扩展名识别压缩格式
	ext := strings.ToLower(filepath.Ext(srcPath))

	// 处理多重扩展名（如 .tar.gz, .tar.xz）
	baseName := strings.TrimSuffix(srcPath, ext)
	secondExt := strings.ToLower(filepath.Ext(baseName))

	var fullExt string
	if secondExt != "" {
		fullExt = secondExt + ext
	} else {
		fullExt = ext
	}

	// 根据文件类型调用相应的解压方法
	switch fullExt {
	case ".tar.gz", ".tgz":
		return extractTarGz(srcPath, destPath)
	case ".tar.xz", ".txz":
		return extractTarXz(srcPath, destPath)
	case ".tar.bz2", ".tbz2", ".tbz":
		return extractTarBz2(srcPath, destPath)
	case ".tar":
		return extractTar(srcPath, destPath)
	case ".gz":
		return extractGz(srcPath, destPath)
	case ".xz":
		return extractXz(srcPath, destPath)
	case ".bz2":
		return extractBz2(srcPath, destPath)
	case ".zip":
		return extractZip(srcPath, destPath)
	default:
		return fmt.Errorf("不支持的压缩格式: %s", fullExt)
	}
}

// extractTar 解压 tar 文件
func extractTar(srcPath, destPath string) error {
	file, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer file.Close()

	tarReader := tar.NewReader(file)
	return extractTarReader(tarReader, destPath)
}

// extractTarGz 解压 tar.gz 文件
func extractTarGz(srcPath, destPath string) error {
	file, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer file.Close()

	gzReader, err := gzip.NewReader(file)
	if err != nil {
		return err
	}
	defer gzReader.Close()

	tarReader := tar.NewReader(gzReader)
	return extractTarReader(tarReader, destPath)
}

// extractTarXz 解压 tar.xz 文件
func extractTarXz(srcPath, destPath string) error {
	file, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer file.Close()

	xzReader, err := xz.NewReader(file)
	if err != nil {
		return err
	}

	tarReader := tar.NewReader(xzReader)
	return extractTarReader(tarReader, destPath)
}

// extractTarBz2 解压 tar.bz2 文件
func extractTarBz2(srcPath, destPath string) error {
	file, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer file.Close()

	bz2Reader := bzip2.NewReader(file)
	tarReader := tar.NewReader(bz2Reader)
	return extractTarReader(tarReader, destPath)
}

// extractTarReader 通用的 tar 解压逻辑
func extractTarReader(tarReader *tar.Reader, destPath string) error {
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		targetPath := filepath.Join(destPath, header.Name)

		// 安全检查：防止路径遍历攻击
		if !strings.HasPrefix(targetPath, filepath.Clean(destPath)+string(os.PathSeparator)) {
			return fmt.Errorf("非法文件路径: %s", header.Name)
		}

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(targetPath, 0755); err != nil {
				return err
			}
		case tar.TypeReg:
			if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
				return err
			}

			file, err := os.OpenFile(targetPath, os.O_CREATE|os.O_WRONLY, os.FileMode(header.Mode))
			if err != nil {
				return err
			}

			if _, err := io.Copy(file, tarReader); err != nil {
				file.Close()
				return err
			}
			file.Close()
		case tar.TypeSymlink:
			if err := os.Symlink(header.Linkname, targetPath); err != nil {
				return err
			}
		}
	}
	return nil
}

// extractZip 解压 zip 文件
func extractZip(srcPath, destPath string) error {
	reader, err := zip.OpenReader(srcPath)
	if err != nil {
		return err
	}
	defer reader.Close()

	for _, file := range reader.File {
		targetPath := filepath.Join(destPath, file.Name)

		// 安全检查：防止路径遍历攻击
		if !strings.HasPrefix(targetPath, filepath.Clean(destPath)+string(os.PathSeparator)) {
			return fmt.Errorf("非法文件路径: %s", file.Name)
		}

		if file.FileInfo().IsDir() {
			if err := os.MkdirAll(targetPath, file.Mode()); err != nil {
				return err
			}
			continue
		}

		if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
			return err
		}

		dstFile, err := os.OpenFile(targetPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
		if err != nil {
			return err
		}

		srcFile, err := file.Open()
		if err != nil {
			dstFile.Close()
			return err
		}

		_, err = io.Copy(dstFile, srcFile)
		srcFile.Close()
		dstFile.Close()

		if err != nil {
			return err
		}
	}
	return nil
}

// extractGz 解压 .gz 文件
func extractGz(srcPath, destPath string) error {
	file, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer file.Close()

	gzReader, err := gzip.NewReader(file)
	if err != nil {
		return err
	}
	defer gzReader.Close()

	// 获取原始文件名（去掉 .gz 扩展名）
	baseName := filepath.Base(srcPath)
	targetName := strings.TrimSuffix(baseName, ".gz")
	targetPath := filepath.Join(destPath, targetName)

	outFile, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, gzReader)
	return err
}

// extractXz 解压 .xz 文件
func extractXz(srcPath, destPath string) error {
	file, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer file.Close()

	xzReader, err := xz.NewReader(file)
	if err != nil {
		return err
	}

	baseName := filepath.Base(srcPath)
	targetName := strings.TrimSuffix(baseName, ".xz")
	targetPath := filepath.Join(destPath, targetName)

	outFile, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, xzReader)
	return err
}

// extractBz2 解压 .bz2 文件
func extractBz2(srcPath, destPath string) error {
	file, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer file.Close()

	bz2Reader := bzip2.NewReader(file)

	baseName := filepath.Base(srcPath)
	targetName := strings.TrimSuffix(baseName, ".bz2")
	targetPath := filepath.Join(destPath, targetName)

	outFile, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, bz2Reader)
	return err
}

// 支持的格式列表
func SupportedFormats() []string {
	return []string{
		".tar", ".tar.gz", ".tgz", ".tar.xz", ".txz",
		".tar.bz2", ".tbz2", ".tbz", ".gz", ".xz", ".bz2", ".zip",
	}
}
