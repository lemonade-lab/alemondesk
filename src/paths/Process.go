package paths

import "path/filepath"

// go-process.json
func GetProcessConfigFilePath() string {
	workPath := GetWorkPath()
	filePath := filepath.Join(workPath, "go-process.json")
	return filePath
}
