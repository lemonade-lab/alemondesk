package paths

import "path/filepath"

func GetStorageThemeFilePath() string {
	storagePath := GetStoragePath()
	filePath := filepath.Join(storagePath, "them.init.json")
	return filePath
}
