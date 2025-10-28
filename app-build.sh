#!/bin/bash

set -e  # 遇到错误立即退出
set -u  # 使用未定义变量时报错

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Required command '$1' not found"
        exit 1
    fi
}

# 主构建函数
main() {
    local is_ci=false
    if [ "$#" -gt 0 ] && [ "$1" = "ci" ]; then
        is_ci=true
        log_info "Running in CI mode"
    fi

    log_info "Building the app..."

    # 检查必要命令
    check_command yarn
    check_command tar
    check_command wails

    # 前端构建
    log_info "Building frontend..."
    if ! yarn --cwd frontend install; then
        log_error "Frontend dependencies installation failed"
        exit 1
    fi
    
    if ! yarn --cwd frontend build; then
        log_error "Frontend build failed"
        exit 1
    fi

    # 处理后端依赖
    log_info "Processing backend dependencies..."
    if ! yarn --cwd resources/template install; then
        log_error "Backend dependencies installation failed"
        exit 1
    fi
    
    # 压缩依赖文件
    log_info "Compressing node_modules..."
    if [ -d "resources/template/node_modules" ]; then
        tar -czf resources/template/node_modules.tar.gz -C resources/template node_modules
        rm -rf resources/template/node_modules
        log_info "Node modules compressed successfully"
    else
        log_warn "node_modules directory not found, skipping compression"
    fi

    # 检查 Node.js 资源
    if [ ! -f "resources/node.tar.xz" ]; then
        log_info "Node.js not found, installing..."
        if [ -f "./app-install-nodejs.sh" ]; then
            ./app-install-nodejs.sh
            log_info "✅ Node.js download completed"
        else
            log_error "app-install-nodejs.sh not found"
            exit 1
        fi
    else
        log_info "Node.js resources already exist"
    fi

    # 构建应用
    if [ "$is_ci" = false ]; then
        log_info "Building Wails application..."
        wails build --clean
    else
        log_info "Skipping Wails build in CI mode"
    fi

    log_info "Build process completed successfully!"
}

# 脚本入口
main "$@"