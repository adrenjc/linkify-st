FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build if needed, though pure node backend might not need build step if no TS/Babel)
# Using ci for clean install
RUN npm ci

# Copy source code
COPY . .

# Prune dev dependencies
RUN npm prune --production

# ---

FROM node:18-alpine

# 安装 docker-cli 以便操作其他容器
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create logs directory
RUN mkdir -p /logs

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "--max-old-space-size=384", "server.js"]
