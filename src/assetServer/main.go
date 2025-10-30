package assetServer

import (
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
					filePath := r.URL.Path[len(resourcePrefix):]

					// 路径安全检查
					filePath = filepath.Clean(filePath)
					if filePath == "" || strings.Contains(filePath, "..") {
						http.Error(w, "Invalid file path", http.StatusBadRequest)
						return
					}

					var contentBytes []byte
					var err error
					// 优先从 embed.FS 读取
					contentBytes, err = assets.ReadFile(filePath)
					if err != nil {
						// embed.FS 读取失败时，尝试从磁盘读取
						contentBytes, err = os.ReadFile(filePath)
						if err != nil {
							http.Error(w, "File not found", http.StatusNotFound)
							return
						}
					}

					// 设置 Content-Type
					ctype := mime.TypeByExtension(filepath.Ext(filePath))
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
