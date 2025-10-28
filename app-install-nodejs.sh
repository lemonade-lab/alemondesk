#!/bin/bash

# 创建资源目录
mkdir -p resources

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

NODE_VERSION="22.14.0"
TARGET_FILE="resources/node.tar.xz"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 检查是否已存在压缩包
if [ -f "$TARGET_FILE" ]; then
    echo "Node.js 压缩包已存在: $TARGET_FILE"
    exit 0
fi

# 主逻辑
main() {
    # 切换到脚本所在目录，确保相对路径正确
    cd "$SCRIPT_DIR"
    
    # 1. 检查是否已存在压缩包
    if [ -f "$TARGET_FILE" ]; then
        echo "✓ Node.js 压缩包已存在: $TARGET_FILE"
        exit 0
    fi
    
    # 2. 直接下载 Node.js
    echo "开始下载 Node.js v${NODE_VERSION} for ${OS}-${ARCH}..."
    URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${OS}-${ARCH}.tar.xz"
    
    # 显示下载信息
    echo "下载地址: $URL"
    echo "目标文件: $TARGET_FILE"
    
    # 使用 curl 下载
    if command -v curl >/dev/null 2>&1; then
        if curl -f -L -o "$TARGET_FILE" "$URL"; then
            echo "✓ 下载成功: $TARGET_FILE"
            
            # 验证文件大小
            file_size=$(stat -f%z "$TARGET_FILE" 2>/dev/null || stat -c%s "$TARGET_FILE" 2>/dev/null || echo "0")
            if [ "$file_size" -gt 10000000 ]; then  # 大于 10MB
                echo "✓ 文件大小验证通过: $(($file_size/1024/1024))MB"
                exit 0
            else
                echo "❌ 文件大小异常，可能下载失败"
                rm -f "$TARGET_FILE"
                exit 1
            fi
        else
            echo "❌ curl 下载失败: $URL"
            exit 1
        fi
    # 使用 wget 下载（备选）
    elif command -v wget >/dev/null 2>&1; then
        echo "使用 wget 下载..."
        if wget -O "$TARGET_FILE" "$URL"; then
            echo "✓ 下载成功: $TARGET_FILE"
            exit 0
        else
            echo "❌ wget 下载失败: $URL"
            exit 1
        fi
    else
        echo "❌ 未找到 curl 或 wget，无法下载"
        exit 1
    fi
}

# 执行主函数
main