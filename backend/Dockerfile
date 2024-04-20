# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json yarn.lock* ./

# 安装所有依赖
RUN yarn install --frozen-lockfile || npm install

# 复制源代码
COPY . .

# Production stage
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json yarn.lock* ./

# 只安装生产依赖
RUN yarn install --frozen-lockfile --production || npm install --only=production
RUN yarn cache clean 2>/dev/null || npm cache clean --force

# 复制源代码
COPY --from=builder /app/server.js ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/user || exit 1

# 启动命令
CMD ["node", "server.js"]
