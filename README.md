# 阿柠檬桌面

AI智能桌面，你的机器人桌面何必仅是一个启动器。

[点击下载 https://github.com/lemonade-lab/alemondesk/releases](https://github.com/lemonade-lab/alemondesk/releases)

<img src="./image.png" >

其功能包括且不仅限于以下功能：

- 对话式控制应用

- 一键启动机器人

- 时时日志监控

- 支持开发者通过开发扩展(webview)提升用户体验

- 可通过git或npm快速安装扩展

- 个性化主题（可导入导出）

⚠️ 非团队所推荐的扩展，不保证其安全性，在使用第三方扩展时，请注意是否是存在非法行为。

## 配置AI

在AI设置中，进行以下示例配置

### DeepSeek

- api_url

```
https://api.deepseek.com/chat/completions
```

- api_key

> 访问 https://www.deepseek.com/ 打开API开放平台创建 API Key

- model

```
deepseek-chat
```

### Ollama

更多请访问 https://ollama.com/

- api_url

```
http://localhost:11434/api/chat
```

## 关于扩展开发

阅读[扩展开发指南🔗https://alemonjs.com/docs/alemonjsDocs/open/desktop](https://alemonjs.com/docs/alemonjsDocs/open/desktop)

## 存储目录

应用数据存储在用户目录下，不同系统路径如下：

| 系统 | 路径 |
| --- | --- |
| macOS | `~/Library/Application Support/alemondesk/` |
| Windows | `%APPDATA%/alemondesk/` |
| Linux | `~/.config/alemondesk/` |

目录结构：

```
alemondesk/
└── work/
    ├── logs/                # 日志目录
    └── resources/
        ├── storage/         # 存储目录（主题、AI配置等）
        ├── template/        # 机器人模板
        ├── yarn/            # Yarn 工具
        └── bots/            # 机器人存储目录
            └── <botName>/
                ├── package.json
                ├── alemon.config.yaml
                ├── yarn.lock
                ├── node_modules/
                └── alemonjs/
                    ├── index.js
                    └── desktop.js
```