package assetServer

import (
	"alemonapp/src/logger"
	"alemonapp/src/paths"
	"embed"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

func CreateAssetServer(assets *embed.FS) *assetserver.Options {
	return &assetserver.Options{
		Assets: assets,
		Middleware: func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				resourcePrefix := "/resource://-/"
				if strings.HasPrefix(r.URL.Path, resourcePrefix) {
					requestPath := r.URL.Path[len(resourcePrefix):]

					// 安全检查1：清理路径
					requestPath = filepath.Clean(requestPath)

					// 安全检查2：禁止空路径和路径遍历
					if requestPath == "" || requestPath == "." || strings.Contains(requestPath, "..") {
						logger.Warn("安全警告：非法路径访问尝试: %s", r.URL.Path)
						http.Error(w, "Invalid file path", http.StatusBadRequest)
						return
					}

					var contentBytes []byte
					var err error
					var fullPath string

					// 安全检查3：处理绝对路径和相对路径
					if filepath.IsAbs(requestPath) {
						// 绝对路径：必须在工作目录内
						absWorkPath, err := filepath.Abs(paths.GetWorkPath())
						if err != nil {
							logger.Error("获取工作目录失败: %v", err)
							http.Error(w, "Internal server error", http.StatusInternalServerError)
							return
						}

						// 规范化请求的绝对路径
						absRequestPath, err := filepath.Abs(requestPath)
						if err != nil {
							logger.Error("路径规范化失败: %v", err)
							http.Error(w, "Internal server error", http.StatusInternalServerError)
							return
						}

						// 检查绝对路径是否在工作目录内
						if !strings.HasPrefix(absRequestPath, absWorkPath+string(filepath.Separator)) &&
							absRequestPath != absWorkPath {
							logger.Warn("安全警告：绝对路径不在工作目录内: %s", requestPath)
							http.Error(w, "Access denied: path outside workspace", http.StatusForbidden)
							return
						}

						// 绝对路径且在工作目录内，直接使用
						fullPath = absRequestPath
						logger.Debug("访问工作目录内的绝对路径: %s", fullPath)
					} else {
						// 相对路径：拼接工作目录
						workPath := paths.GetWorkPath()
						fullPath = filepath.Join(workPath, requestPath)

						// 安全检查4：确保拼接后的路径在工作目录内（防止符号链接等攻击）
						absFullPath, err := filepath.Abs(fullPath)
						if err != nil {
							logger.Error("路径解析失败: %v", err)
							http.Error(w, "Internal server error", http.StatusInternalServerError)
							return
						}

						absWorkPath, err := filepath.Abs(workPath)
						if err != nil {
							logger.Error("工作目录解析失败: %v", err)
							http.Error(w, "Internal server error", http.StatusInternalServerError)
							return
						}

						// 检查拼接后的路径是否在工作目录内
						if !strings.HasPrefix(absFullPath, absWorkPath+string(filepath.Separator)) &&
							absFullPath != absWorkPath {
							logger.Warn("安全警告：相对路径解析后超出工作目录: %s", requestPath)
							http.Error(w, "Access denied", http.StatusForbidden)
							return
						}

						fullPath = absFullPath
					}

					// 优先从 embed.FS 读取（仅对相对路径有效）
					if !filepath.IsAbs(requestPath) {
						contentBytes, err = assets.ReadFile(requestPath)
						if err == nil {
							logger.Debug("从 embed.FS 读取资源: %s", requestPath)
						}
					}

					// embed.FS 读取失败或是绝对路径，从磁盘读取
					if contentBytes == nil {
						contentBytes, err = os.ReadFile(fullPath)
						if err != nil {
							logger.Debug("文件未找到: %s", fullPath)
							http.Error(w, "File not found", http.StatusNotFound)
							return
						}
						logger.Debug("从磁盘读取资源: %s", fullPath)
					}

					// 设置 Content-Type
					ctype := mime.TypeByExtension(filepath.Ext(requestPath))
					if ctype == "" {
						ctype = "application/octet-stream"
					}
					w.Header().Set("Content-Type", ctype)
					w.Write(contentBytes)
					return
				}
				// 其他请求继续正常处理
				next.ServeHTTP(w, r)
			})
		},
	}
}
