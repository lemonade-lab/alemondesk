#!/bin/bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检测操作系统和架构
detect_platform() {
    case "$(uname -s)" in
        Linux*)
            OS=linux
            ;;
        Darwin*)
            OS=darwin
            ;;
        MINGW64*|CYGWIN*|MSYS*)
            OS=windows
            ;;
        *)
            log_error "Unsupported OS: $(uname -s)"
            exit 1
            ;;
    esac

    case "$(uname -m)" in
        x86_64|amd64)
            ARCH=x64
            ;;
        aarch64|arm64)
            ARCH=arm64
            ;;
        *)
            log_error "Unsupported architecture: $(uname -m)"
            exit 1
            ;;
    esac

    echo "${OS}-${ARCH}"
}

# 下载 Node.js
download_nodejs() {
    local platform=$1
    local node_version="20.18.0"  # 可以根据需要调整版本
    
    log_info "Downloading Node.js v${node_version} for ${platform}..."
    
    case "${platform}" in
        linux-x64)
            url="https://nodejs.org/dist/v${node_version}/node-v${node_version}-linux-x64.tar.xz"
            ;;
        darwin-x64)
            url="https://nodejs.org/dist/v${node_version}/node-v${node_version}-darwin-x64.tar.gz"
            ;;
        darwin-arm64)
            url="https://nodejs.org/dist/v${node_version}/node-v${node_version}-darwin-arm64.tar.gz"
            ;;
        windows-x64)
            url="https://nodejs.org/dist/v${node_version}/node-v${node_version}-win-x64.zip"
            ;;
        *)
            log_error "Unsupported platform: ${platform}"
            exit 1
            ;;
    esac

    # 下载文件
    if command -v curl &> /dev/null; then
        curl -L -o "resources/node.tar.xz" "$url"
    elif command -v wget &> /dev/null; then
        wget -O "resources/node.tar.xz" "$url"
    else
        log_error "Neither curl nor wget is available"
        exit 1
    fi

    if [ $? -eq 0 ]; then
        log_info "✅ Node.js downloaded successfully"
    else
        log_error "Failed to download Node.js"
        exit 1
    fi
}

main() {
    log_info "Starting Node.js installation..."
    
    # 检测平台
    platform=$(detect_platform)
    log_info "Detected platform: ${platform}"
    
    # 下载 Node.js
    download_nodejs "${platform}"
    
    log_info "Node.js installation completed!"
}

main "$@"