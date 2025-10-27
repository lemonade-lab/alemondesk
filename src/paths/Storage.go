package paths

import "path/filepath"

func GetStorageThemeFilePath() string {
	storagePath := GetStoragePath()
	filePath := filepath.Join(storagePath, "theme.init.json")
	return filePath
}
