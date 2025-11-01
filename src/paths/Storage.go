package paths

import "path/filepath"

func GetStorageThemeFilePath() string {
	storagePath := GetStoragePath()
	filePath := filepath.Join(storagePath, "them.init.json")
	return filePath
}

func GetStoragePersonalThemeFilePath() string {
	storagePath := GetStoragePath()
	filePath := filepath.Join(storagePath, "them.personal.json")
	return filePath
}
