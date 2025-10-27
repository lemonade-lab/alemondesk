package paths

import "path/filepath"

func GetAppConfigPath() string {
	workPath := GetWorkPath()
	filePath := filepath.Join(workPath, "app-config.json")
	return filePath
}
