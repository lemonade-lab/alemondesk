## Dev

```sh
npm i yarn -g
go install -v github.com/wailsapp/wails/v3/cmd/wails3@latest
go install github.com/evilmartians/lefthook@latest
go mod tidy
```

- 开发启动

```sh
chmod +x app-*.sh 
# 需安装 make
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