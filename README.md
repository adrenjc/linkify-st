# ShortLink - 开源私有化短链接平台

<p align="center">
  <strong>🔗 完全开源、一键私有化部署的短链接管理系统</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Self--Hosted-✓-brightgreen" alt="Self-Hosted">
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18-green?logo=node.js" alt="Node.js">
</p>

---

## 🎯 为什么选择 ShortLink？

> **告别第三方依赖，掌控你的数据主权**

| 对比项 | 第三方短链服务 | ShortLink 私有化部署 |
|--------|---------------|---------------------|
| 📦 **数据归属** | 存储在第三方服务器 | ✅ 完全存储在你的服务器 |
| 🔐 **隐私安全** | 可能存在数据泄露风险 | ✅ 内网隔离，绝对安全 |
| 💰 **费用** | 按量付费，成本不可控 | ✅ 一次部署，永久免费 |
| 🎛 **定制化** | 功能受限，无法定制 | ✅ 开源代码，自由修改 |
| 🌐 **自定义域名** | 需要付费或限制使用 | ✅ 无限制绑定自有域名 + 自动 SSL |

---

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| 🔗 **短链管理** | 创建、编辑、删除短链接，支持批量操作 |
| 🌐 **多域名支持** | 绑定自有域名，自动申请 Let's Encrypt SSL 证书 |
| 🔐 **RBAC 权限** | 企业级角色权限系统 |
| 📊 **审计日志** | 完整操作记录，支持导出分析 |
| 🚀 **高性能** | Redis 缓存加速，重定向延迟 < 10ms |

---

## 🛠 技术架构 (混合模式)

```
┌─────────────────────────────────────────────────────────────┐
│                    🔒 Hybrid 混合部署                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐                                            │
│  │   Nginx     │  ◀──── 宿主机（反向代理 + SSL）              │
│  └──────┬──────┘                                            │
│         │                                                   │
│         ├──────▶  Frontend (Docker, 端口 3000)               │
│         │                                                   │
│         └──────▶  Backend (PM2/宿主机, 端口 5000)             │
│                        │                                    │
│                        ▼                                    │
│              ┌─────────────────────┐                        │
│              │  MongoDB + Redis   │  ◀──── Docker 容器       │
│              └─────────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| 组件 | 运行位置 | 说明 |
|------|---------|------|
| **前端** | Docker 容器 | 从 GHCR 拉取镜像，无需在服务器构建 |
| **后端** | 宿主机 PM2 | 需要宿主机权限执行 SSL 证书申请 |
| **数据库** | Docker 容器 | MongoDB + Redis |
| **反向代理** | 宿主机 Nginx | 统一入口 + SSL 终结 |

---

## 📦 完整部署指南

### 环境要求

- **服务器**: Linux (Ubuntu 22.04 推荐), 1 核 1G 内存起步
- **域名**: 至少一个已解析到服务器 IP 的域名
- **软件**: Docker, Node.js 18+, Nginx, PM2, acme.sh

---

### 步骤 1：服务器基础环境安装

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 1. 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 重新登录 SSH 使 docker 组生效

# 2. 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. 安装 Nginx
sudo apt install -y nginx

# 4. 安装 PM2
sudo npm install -g pm2

# 5. 安装 acme.sh (SSL 证书)
curl https://get.acme.sh | sh
source ~/.bashrc

# 验证安装
docker --version && node --version && nginx -v && pm2 --version
```

---

### 步骤 2：克隆项目并配置环境变量

```bash
# 克隆项目
cd /var/www
sudo mkdir -p shortlink && sudo chown $(whoami):$(whoami) shortlink
git clone <your-repository-url> shortlink
cd shortlink

# 复制并编辑环境变量
cp .env.example .env
nano .env
```

**必须配置的 `.env` 变量：**

```bash
# GitHub 用户名（用于拉取前端镜像）
GITHUB_USERNAME=your_github_username

# JWT 密钥（生成：openssl rand -hex 32）
JWT_SECRET=your_super_secure_jwt_secret
```

---

### 步骤 3：启动 Docker 服务（前端 + 数据库）

```bash
# 登录 GitHub Container Registry（如果镜像是私有的）
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# 启动所有 Docker 服务
docker compose up -d

# 验证容器运行
docker ps
# 应看到：linkify-frontend, linkify-mongo, linkify-redis
```

> 💡 前端镜像由 GitHub Actions 自动构建并推送到 GHCR，服务器只需拉取即可，无需本地构建。

---

### 步骤 4：配置并启动后端

```bash
cd /var/www/shortlink/backend

# 安装依赖
npm install

# 编辑生产环境配置
# 从示例文件创建
cp .env.example .env.production
nano .env.production

# 必须配置的项：
# - JWT_SECRET：使用 openssl rand -hex 32 生成
# - ACME_EMAIL：你的邮箱（用于SSL证书通知）
# - DASHSCOPE_API_KEY：阿里云AI API Key（可选）

# 使用 PM2 启动
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save

# 验证
pm2 status
curl http://localhost:5000/api/health
```

---

### 步骤 5：配置 Nginx

```bash
# 备份默认配置
sudo mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak

# 复制项目 Nginx 配置
sudo cp /var/www/shortlink/backend/nginx/nginx.conf /etc/nginx/nginx.conf

# 编辑配置，替换占位符
sudo nano /etc/nginx/nginx.conf
# 修改：
# - YOUR_SERVER_IP → 你的服务器 IP
# - your-domain.com → 你的域名
# - www.your-domain.com → 完整域名

# 创建必要目录
sudo mkdir -p /etc/nginx/ssl /etc/nginx/ssl/domains /var/www/html

# 测试并重启
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

---

### 步骤 6：申请 SSL 证书

```bash
# 申请证书
~/.acme.sh/acme.sh --issue -d your-domain.com -d www.your-domain.com -w /var/www/html

# 安装证书
~/.acme.sh/acme.sh --install-cert -d your-domain.com \
  --key-file /etc/nginx/ssl/your-domain.com.key \
  --fullchain-file /etc/nginx/ssl/your-domain.com.pem \
  --reloadcmd "sudo systemctl reload nginx"
```

---

### 步骤 7：初始化数据库

```bash
cd /var/www/shortlink/backend
npm run seed:prod
```

---

### 步骤 8：验证部署

1. 访问 `https://www.your-domain.com`
2. 使用默认账号登录：
   - 用户名：`admin`
   - 密码：`admin123`
3. **立即修改默认密码！**

---

## 🔄 更新部署

### 更新前端（Docker 镜像）

```bash
cd /var/www/shortlink
docker compose pull frontend
docker compose up -d frontend
```

### 更新后端

```bash
cd /var/www/shortlink
git pull
cd backend && npm install
pm2 restart shortlink-backend
```

---

## 🔧 日常维护

```bash
# 查看服务状态
pm2 status
docker ps

# 查看日志
pm2 logs shortlink-backend
docker logs linkify-frontend

# 数据库备份
cd /var/www/shortlink/backend
npm run backup

# 设置自动备份
npm run setup-backup
```

---

## 📁 项目结构

```
shortlink/
├── frontend/              # 前端 (Docker 镜像)
│   └── Dockerfile
├── backend/               # 后端 (PM2 运行)
│   ├── src/
│   ├── nginx/nginx.conf   # Nginx 配置模板
│   ├── ecosystem.config.js
│   └── .env.production
├── docker-compose.yml     # Docker 编排
└── .env.example           # 环境变量模板
```

---

## 🛡 安全建议

1. **修改默认密码**
2. **设置防火墙**：只开放 80/443 端口
3. **定期备份**：`npm run setup-backup`
4. **保护配置文件**：`chmod 600 .env*`

---

## 📄 License

[MIT License](LICENSE)
