# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json yarn.lock* ./

# 安装依赖（优先用 yarn）
RUN yarn install --frozen-lockfile || npm install

# 复制源代码和配置
COPY . .

# 构建生产版本
RUN yarn build:prod || npm run build:prod

# Production stage - 使用 nginx 托管静态文件
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
