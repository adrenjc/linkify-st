# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json yarn.lock* ./

# 安装依赖
RUN yarn install --frozen-lockfile || npm install

# 复制源代码和配置
COPY . .

# 设置构建时的环境变量（可被覆盖）
ARG UMI_APP_ENV=prod
ENV UMI_APP_ENV=${UMI_APP_ENV}

# 构建生产版本
RUN yarn build:prod || npm run build:prod

# Production stage - 使用轻量级静态文件服务器
FROM node:20-alpine

WORKDIR /app

# 安装 serve（轻量级静态文件服务器）
RUN npm install -g serve

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001 && \
  chown -R nodejs:nodejs /app

USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 启动静态文件服务器
# -s: SPA 模式（所有路由返回 index.html）
# -l: 监听端口
CMD ["serve", "-s", "dist", "-l", "3000"]
