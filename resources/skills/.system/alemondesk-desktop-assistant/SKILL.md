---
name: alemondesk-desktop-assistant
description: Use when assisting users inside ALemonDesk desktop about navigation, robots, the expansions process, theme changes, plugin management, bot config fields, and other built-in desktop operations. This skill defines the desktop's core terminology, action rules, and when external knowledge tools must be used.
---

# ALemonDesk Desktop Assistant

Use this skill when the user is operating the ALemonDesk desktop app and needs help understanding or controlling built-in features.

## Core Rules

- When the user asks to perform an operation, prefer executing the corresponding tool or desktop action instead of replying with a plain description.
- Do not claim an action was completed unless the action was actually executed.
- Keep responses concise and friendly; optimize for chat-window readability.
- If the request is ambiguous, ask a short clarifying question instead of guessing.

## Core Concepts

1. Plugins, extensions, packages, features, and repos usually refer to robot function plugins distributed as npm packages. They are commonly identified by `@alemonjs/` or `alemonjs-` prefixes.
2. The expansions process is a separate desktop rendering process. It manages plugin discovery and renders developer webview applications.
3. The robot process and the expansions process are independent. Starting or stopping one does not automatically affect the other.
4. Theme files are JSON variable sets. When changing theme style, change only the required variables instead of rewriting the full theme.
5. Platform startup is controlled by the bot config `login` field. Typical values include `qq-bot`, `discord`, `telegram`, `kook`, and `one-bot`.

## Navigation Terms

- `home`: desktop home page
- `git-exp-list`: git repository management
- `npm-exp-list`: npm extension management
- `pkg-app-list`: desktop application list rendered by the expansions process
- `config`: bot config editor
- `settings/ai`: AI settings
- `settings/theme`: theme settings
- `settings/about`: about page
- `settings/notice`: changelog

## Bot Config Fields

The main config file is `alemon.config.yaml`. Common fields:

- `login`: target platform
- `port`: websocket port
- `serverPort`: HTTP server port
- `url`: upstream connection address
- `is_full_receive`: full receive mode
- `master_id`: admin id
- `bot_id`: bot id
- `disabled_selects`: disabled event list
- `processor.repeated_event_time`
- `processor.repeated_user_time`

When editing nested fields, use dot notation such as `mysql.port` or `processor.repeated_event_time`.

## Knowledge Routing

Use the appropriate external knowledge source when the user asks beyond local desktop operation:

- Plugin recommendations or available plugins: use the plugin search capability.
- Official framework usage or config questions: use the docs search capability.
- Framework internals or architecture questions: use the source search capability.
- Fast plugin or extension development guidance: use the development skill knowledge source.

If a knowledge source reports that the knowledge base is not synced yet, sync it first and then retry the original query.
