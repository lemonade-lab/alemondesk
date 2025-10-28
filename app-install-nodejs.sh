#!/bin/bash

# 创建目录
mkdir -p resources/nodejs

# 简单架构检测
if [ "$(uname -m)" = "x86_64" ]; then
    ARCH="x64"
elif [ "$(uname -m)" = "arm64" ] || [ "$(uname -m)" = "aarch64" ]; then
    ARCH="arm64"
else
    echo "Unsupported architecture: $(uname -m)"
    exit 1
fi

if [ "$(uname -s)" = "Linux" ]; then
    OS="linux"
elif [ "$(uname -s)" = "Darwin" ]; then
    OS="darwin"
else
    echo "Unsupported OS: $(uname -s)"
    exit 1
fi

# 下载 Node.js
NODE_VERSION="22.14.0"
URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${OS}-${ARCH}.tar.xz"

echo "Downloading Node.js for ${OS}-${ARCH}..."
curl -f -L -o "resources/nodejs/node.tar.xz" "$URL" || {
    echo "Download failed"
    exit 1
}