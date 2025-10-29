//go:build windows

package utils

import (
	"os"
	"os/exec"
	"runtime"
	"syscall"
)

func Command(name string, arg ...string) *exec.Cmd {
	cmd := exec.Command(name, arg...)
	if runtime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{
			HideWindow: true,
		}
	}
	cmd.Env = os.Environ()
	return cmd
}
