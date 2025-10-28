package config

import "os"

var BotName = "default"

func IsDev() bool {
	return os.Getenv("APP_WAILS_DEV") == "true"
}
