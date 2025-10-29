//go:build !windows

package utils

import (
	"os"
	"os/exec"
)

func Command(name string, arg ...string) *exec.Cmd {
	cmd := exec.Command(name, arg...)
	cmd.Env = os.Environ()
	return cmd
}
