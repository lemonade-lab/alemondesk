package paths

import "path/filepath"

func GetPreloadPath() string {
	resourcePath := GetResourcePath()
	return filepath.Join(resourcePath, "webview", "preload.js")
}
