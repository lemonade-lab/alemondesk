## Dev

```sh
npm i yarn -g
go install github.com/wailsapp/wails/v2/cmd/wails@latest
go mod tidy
```

- 开发启动

```sh
chmod +x app-*.sh 
make dev
```

```sh
# 手动生产module
wails generate module  
```

- 打包测试

```sh
chmod +x app-*.sh 
make build
```

- 日志

```sh
# macos 查看日志
cat ~/Library/Application\ Support/ALemonDesk/logs/alemon-desk.log
```