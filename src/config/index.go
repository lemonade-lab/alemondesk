package config

import "os"

const BotName = "default"

func IsDev() bool {
	return os.Getenv("APP_WAILS_DEV") == "true"
}
