# 阿柠檬桌面

一款安装即用的，适用于桌面的单应用ALemonJS机器人操作的程序。

这是全新重构版，相比于旧版本(基于electron)，

1）启动速度，3s -> 1s。
2）渲染速度快，卡顿率下降。
3）拥有更高的执行性能。
4）删除了自动更新。
5）内置依赖文件。智能缓存。（不再需要手动安装）
7）删除了npm商店（不稳定）
8）优化了日志系统

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