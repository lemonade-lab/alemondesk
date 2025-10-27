package assetServer

import (
	"embed"
	"log"
	"net/http"
	"os"

	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

func CreateAssetServer(assets *embed.FS) *assetserver.Options {
	return &assetserver.Options{
		Assets: assets,
		Middleware: func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				resourcePrefix := "resource://-/"
				if len(r.URL.Path) > len(resourcePrefix) && r.URL.Path[:len(resourcePrefix)] == resourcePrefix {
					log.Println("Resource request:", r.URL.Path)
					filePath := r.URL.Path[len(resourcePrefix):]
					contentBytes, err := os.ReadFile(filePath)
					if err != nil {
						http.Error(w, "File not found", http.StatusNotFound)
						return
					}
					content := string(contentBytes)
					w.Header().Set("Content-Type", "text/html")
					w.Write([]byte(content))
					return
				}
				// 处理 app://-/ 开头的请求
				appPrefix := "app://-/"
				if len(r.URL.Path) > len(appPrefix) && r.URL.Path[:len(appPrefix)] == appPrefix {
					filePath := r.URL.Path[len(appPrefix):]
					contentBytes, err := os.ReadFile(filePath)
					if err != nil {
						http.Error(w, "File not found", http.StatusNotFound)
						return
					}
					content := string(contentBytes)
					w.Header().Set("Content-Type", "text/html")
					w.Write([]byte(content))
					return
				}
				// 其他请求继续正常处理
				next.ServeHTTP(w, r)
			})
		},
	}
}
