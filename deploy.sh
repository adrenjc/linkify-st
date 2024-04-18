#!/bin/bash

# ShortLink 一键部署脚本
# 用法: ./deploy.sh [start|stop|restart|logs|status]

set -e

COMPOSE_FILE="docker-compose.yml"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
}

# 检查环境变量文件
check_env() {
    if [ ! -f ".env" ]; then
        log_warn ".env 文件不存在，正在从 .env.example 复制..."
        cp .env.example .env
        log_warn "请修改 .env 文件中的 JWT_SECRET 为安全的密钥！"
    fi
}

# 启动服务
start() {
    log_info "正在构建并启动服务..."
    docker compose -f $COMPOSE_FILE up -d --build
    log_info "服务启动完成！"
    log_info "前端访问地址: http://localhost"
    log_info "后端 API 地址: http://localhost:5000"
}

# 停止服务
stop() {
    log_info "正在停止服务..."
    docker compose -f $COMPOSE_FILE down
    log_info "服务已停止"
}

# 重启服务
restart() {
    stop
    start
}

# 查看日志
logs() {
    docker compose -f $COMPOSE_FILE logs -f
}

# 查看状态
status() {
    docker compose -f $COMPOSE_FILE ps
}

# 初始化数据库（运行种子脚本）
seed() {
    log_info "正在初始化数据库..."
    docker compose -f $COMPOSE_FILE exec backend node scripts/seed.js
    log_info "数据库初始化完成"
}

# 主入口
main() {
    check_docker
    check_env

    case "${1:-start}" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs
            ;;
        status)
            status
            ;;
        seed)
            seed
            ;;
        *)
            echo "用法: $0 {start|stop|restart|logs|status|seed}"
            exit 1
            ;;
    esac
}

main "$@"
