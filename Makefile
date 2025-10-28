.PHONY: help build run dev test clean install deps lint format swagger docker-build docker-run

# 默认目标
.DEFAULT_GOAL := help

# 帮助信息
help: ## 显示帮助信息
	@echo "ALemonGO 可用命令:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# 开发相关命令
dev: ## 启动开发模式
	@echo "启动开发模式..."
	sh ./app-dev.sh

build: ## 构建项目
	@echo "构建项目..."
	sh ./app-build.sh