#!/bin/bash

echo "Building the app..."

# 前端构建
yarn --cwd frontend install

# 如果不存在dist目录。则进行一次build
[ ! -f "frontend/dist/index.html" ] && yarn --cwd frontend build

# 不存在压缩包
if [ ! -f "resources/template/node_modules.tar.gz" ]; then
   # 处理后端依赖
   yarn --cwd resources/template install
   # 立即压缩依赖文件
   tar -czf resources/template/node_modules.tar.gz -C resources/template node_modules
   # 删除未压缩的依赖文件夹以节省空间
   rm -rf resources/template/node_modules
fi

# 判断是否有安装nnode.tar.xz到resources/nodejs目录下
if [ ! -f "resources/node.tar.xz" ]; then
   # 需要立即安装nodejs
   ./app-install-nodejs.sh
   echo "✅ Node.js download completed"
fi

# 开始启动开发模式
wails dev