# ShortLink - 短链接管理平台

<p align="center">
  <strong>🔗 一个功能完善的短链接生成与管理系统</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-6-green?logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker" alt="Docker">
</p>

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 🔗 **短链管理** | 创建、编辑、删除短链接，支持自定义域名 |
| 🔐 **RBAC 权限** | 完整的角色-权限管理系统，支持细粒度 API 控制 |
| 📊 **审计日志** | 全面的操作记录，支持统计分析 |
| 🌐 **多域名支持** | 自定义域名绑定与 DNS 验证 |
| 🚀 **Redis 缓存** | 高性能缓存层，加速短链重定向 |
| 🌍 **国际化** | 内置多语言支持 |
| 🐳 **Docker 部署** | 一键 Docker Compose 部署 |

---

## 🛠 技术栈

### 前端
- **React 18** + TypeScript
- **Ant Design 5** + Pro Components
- **UmiJS 4** 企业级框架

### 后端
- **Express.js** RESTful API
- **MongoDB** 文档数据库
- **Redis** 缓存层
- **JWT** 身份认证

---

## 🚀 快速开始

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+

### 一键部署

```bash
# 1. 克隆项目
git clone <repository-url>
cd shortlink

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改 JWT_SECRET 为安全的随机字符串

# 3. 构建并启动服务
docker compose up -d --build

# 4. 查看服务状态
docker compose ps

# 5. 初始化数据库（首次部署，等待服务启动后执行）
docker compose exec backend node scripts/seed.js
```

访问 **http://localhost** 即可使用！

### 使用部署脚本（Linux/macOS）

```bash
chmod +x deploy.sh
./deploy.sh start    # 启动服务
./deploy.sh stop     # 停止服务
./deploy.sh restart  # 重启服务
./deploy.sh logs     # 查看日志
./deploy.sh status   # 查看状态
./deploy.sh seed     # 初始化数据库
```

---

## 📁 项目结构

```
shortlink/
├── frontend/           # 前端应用 (React + Ant Design Pro)
│   ├── src/
│   │   ├── pages/      # 页面组件
│   │   ├── services/   # API 服务
│   │   ├── components/ # 公共组件
│   │   └── access.ts   # 权限控制
│   ├── config/         # 配置文件
│   ├── docker/         # Nginx 配置
│   └── Dockerfile
├── backend/            # 后端 API (Express + MongoDB)
│   ├── src/
│   │   ├── controllers/# 控制器
│   │   ├── models/     # 数据模型
│   │   ├── routes/     # 路由
│   │   └── middleware/ # 中间件
│   ├── scripts/        # 脚本（seed.js）
│   └── Dockerfile
├── .github/workflows/  # GitHub Actions CI/CD
├── docker-compose.yml  # Docker 编排
├── deploy.sh           # 部署脚本
└── README.md
```

---

## 🔑 默认账号

初始化数据库后可使用：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |

> ⚠️ 生产环境请立即修改默认密码！

---

## 🏗 架构图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Nginx     │────▶│   Backend   │
│             │     │  (Frontend) │     │  (Express)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
                          ▼                    ▼                    ▼
                    ┌───────────┐        ┌───────────┐        ┌───────────┐
                    │  MongoDB  │        │   Redis   │        │  Audit    │
                    │   (Data)  │        │  (Cache)  │        │   Log     │
                    └───────────┘        └───────────┘        └───────────┘
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

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 License

MIT License
