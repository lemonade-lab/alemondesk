#!/bin/bash

echo "Building the app..."

# 前端构建
yarn --cwd frontend install

# 如果不存在dist目录。则进行一次build
[ ! -d "frontend/dist" ] && yarn --cwd frontend build

# 删除被压缩的依赖文件夹以节省空间
if [ -d "resources/template/node_modules.tar.gz" ]; then
   rm -rf resources/template/node_modules.tar.gz
fi

yarn --cwd resources/template install

# 判断是否有安装nnode.tar.xz到resources/nodejs目录下
if [ ! -f "resources/nodejs/node.tar.xz" ]; then
   # 需要立即安装nodejs
   ./app-install-nodejs.sh
   echo "✅ Node.js download completed"
fi

# 开始启动开发模式
wails dev