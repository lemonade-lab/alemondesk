#!/bin/bash

set -e
set -u

yarn --cwd frontend install
yarn --cwd frontend build

yarn --cwd resources/template install
find resources/template/node_modules -type l -exec rm {} + # 得删除软链接
tar -czf resources/node_modules.tar.gz -C resources/template node_modules
rm -rf resources/template/node_modules

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

wails build --clean --platform=$PLATFORM