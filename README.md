# ShortLink - 开源私有化短链接平台

<p align="center">
  <strong>🔗 完全开源、一键私有化部署的短链接管理系统</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Self--Hosted-✓-brightgreen" alt="Self-Hosted">
  <img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker" alt="Docker">
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
| 📊 **统计数据** | 基础统计或付费升级 | ✅ 完整审计日志，自由分析 |
| 🌐 **自定义域名** | 需要付费或限制使用 | ✅ 无限制绑定自有域名 |

---

## ⚡ 30 秒快速部署

只需一台服务器 + Docker，即可拥有完整的短链接服务：

```bash
# 1. 克隆项目
git clone <repository-url> && cd shortlink

# 2. 配置环境变量
cp .env.example .env
# 修改 .env 中的 JWT_SECRET

# 3. 一键启动
docker compose up -d --build

# 4. 初始化数据库
docker compose exec backend node scripts/seed.js
```

🎉 访问 **http://your-server-ip** 即可使用！

---

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| 🔗 **短链管理** | 创建、编辑、删除短链接，支持批量操作 |
| 🌐 **多域名支持** | 绑定自有域名，支持 DNS 验证 |
| 🔐 **RBAC 权限** | 企业级角色权限系统，支持 API 级别控制 |
| 📊 **审计日志** | 完整操作记录，支持导出分析 |
| 🚀 **高性能** | Redis 缓存加速，重定向延迟 < 10ms |
| 🌍 **国际化** | 内置中/英文支持 |

---

## 🛠 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                    🔒 私有化部署环境                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Nginx     │────▶│   Backend   │────▶│  MongoDB    │   │
│  │  (Frontend) │     │  (Express)  │     │  (数据存储)  │   │
│  └─────────────┘     └──────┬──────┘     └─────────────┘   │
│                             │                               │
│                             ▼                               │
│                       ┌───────────┐                         │
│                       │   Redis   │                         │
│                       │  (缓存层)  │                         │
│                       └───────────┘                         │
└─────────────────────────────────────────────────────────────┘
          ↑ 所有组件均运行在你的服务器上，数据不外传
```

| 层级 | 技术选型 |
|------|---------|
| **前端** | React 18 + TypeScript + Ant Design Pro + UmiJS 4 |
| **后端** | Express.js + JWT 身份认证 |
| **数据库** | MongoDB 文档存储 |
| **缓存** | Redis 高性能缓存 |
| **部署** | Docker + Docker Compose 容器化 |

---

## 📦 部署方式

### 方式一：Docker Compose（推荐）

```bash
docker compose up -d --build
```

### 方式二：部署脚本

```bash
chmod +x deploy.sh
./deploy.sh start    # 启动服务
./deploy.sh stop     # 停止服务
./deploy.sh restart  # 重启服务
./deploy.sh logs     # 查看日志
./deploy.sh seed     # 初始化数据库
```

### 环境要求

- 服务器：1 核 1G 内存起步
- 系统：Linux（推荐 Ubuntu 22.04）
- 依赖：Docker 20.10+ / Docker Compose 2.0+

---

## 🔑 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |

> ⚠️ **安全提示**：首次登录后请立即修改默认密码！

---

## 📁 项目结构

```
shortlink/
├── frontend/           # 前端 (React + Ant Design Pro)
│   ├── src/
│   ├── docker/         # Nginx 配置
│   └── Dockerfile
├── backend/            # 后端 API (Express + MongoDB)
│   ├── src/
│   ├── scripts/        # 初始化脚本
│   └── Dockerfile
├── .github/workflows/  # GitHub Actions CI/CD
├── docker-compose.yml  # Docker 编排配置
├── deploy.sh           # 部署脚本
└── .env.example        # 环境变量模板
```

---

## 📖 API 概览

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/login` | 用户登录 |
| POST | `/api/links` | 创建短链接 |
| GET | `/api/links` | 获取短链列表 |
| GET | `/api/r/:key` | 短链重定向 |
| GET | `/api/audit-logs` | 查询审计日志 |

---

## 🗺 路线图

- [x] 核心短链功能
- [x] RBAC 权限系统
- [x] Docker 一键部署
- [ ] 点击统计分析面板
- [ ] 二维码生成
- [ ] API 密钥管理

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 License

[MIT License](LICENSE) - 自由使用、修改和分发
