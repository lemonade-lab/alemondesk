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

func GetStorageAIConfigFilePath() string {
	storagePath := GetStoragePath()
	filePath := filepath.Join(storagePath, "ai.config.json")
	return filePath
}

func GetSkillsPath() string {
	resourcePath := GetResourcePath()
	return filepath.Join(resourcePath, "skills")
}

func GetSkillsSystemPath() string {
	return filepath.Join(GetSkillsPath(), ".system")
}
