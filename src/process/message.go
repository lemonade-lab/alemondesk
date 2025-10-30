package process

import (
	"alemonapp/src/logger"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type IPCMessageWriter struct {
	ProcessName    string
	MessageHandler func(message map[string]interface{})
}

func (w *IPCMessageWriter) Write(p []byte) (n int, err error) {
	data := string(p)

	// 检查是否是 IPC 消息（包含 __STDIN_JSON_DATA）
	if strings.Contains(data, "__STDIN_JSON_DATA") {
		// 尝试解析 JSON 消息
		var message map[string]interface{}
		if err := json.Unmarshal([]byte(strings.TrimSpace(data)), &message); err == nil {
			// 调用消息处理器
			if w.MessageHandler != nil {
				w.MessageHandler(message)
			}
		}
		// 无论解析成功与否，都返回写入成功
		return len(p), nil
	}
	// os.Stderr.Write(p)
	logger.Info(data)
	return len(p), nil
}

// 发送消息到 Node.js 进程
func (mp *ManagedProcess) Send(message map[string]interface{}) error {
	mp.mu.Lock()
	defer mp.mu.Unlock()

	if mp.stdinPipe == nil {
		return fmt.Errorf("stdin pipe not available")
	}

	message["name"] = mp.Config.Name[:len(mp.Config.Name)-5]
	message["from"] = "go"
	message["timestamp"] = time.Now().Unix()
	message["__STDIN_JSON_DATA"] = true

	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	_, err = mp.stdinPipe.Write(append(data, '\n'))
	return err
}

var handleMessages = make(map[string]func(message map[string]interface{}))

func SetHandleMessage(name string, message func(message map[string]interface{})) {
	handleMessages[name+"-desk"] = message
}
