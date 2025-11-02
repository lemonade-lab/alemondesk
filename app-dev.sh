#!/bin/bash

echo "Building the app..."

# 前端构建
yarn --cwd frontend install

# 如果不存在dist目录。则进行一次build
[ ! -f "frontend/dist/index.html" ] && yarn --cwd frontend build:dev

# 不存在压缩包
if [ ! -f "resources/node_modules.tar.gz" ]; then
   # 处理后端依赖
   yarn --cwd resources/template install
   find resources/template/node_modules -type l -exec rm {} + # 得删除软链接
   # 立即压缩依赖文件
   tar -czf resources/node_modules.tar.gz -C resources/template node_modules
   # 删除未压缩的依赖文件夹以节省空间
   rm -rf resources/template/node_modules
fi

NODE_VERSION="22.21.0"
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
    x86_64) NODE_ARCH="x64" ;;
    aarch64) NODE_ARCH="arm64" ;;
    *) NODE_ARCH="x64" ;;
esac

if [ "$PLATFORM" = "darwin" ]; then
    NODE_ARCH="darwin-$NODE_ARCH"
    NODE_FILE="node-v$NODE_VERSION-$NODE_ARCH.tar.gz"
elif [ "$PLATFORM" = "linux" ]; then
    NODE_ARCH="linux-$NODE_ARCH"
    NODE_FILE="node-v$NODE_VERSION-$NODE_ARCH.tar.xz"
fi

# 判断是否有下载node.tar.xz
if [ ! -f "resources/node.tar.xz" ]; then
   curl -L "https://nodejs.org/dist/v$NODE_VERSION/$NODE_FILE" -o resources/node.tar.xz
fi

# 开始启动开发模式
wails3 dev