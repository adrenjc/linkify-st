# ShortLink 部署指南 (Docker Compose)

本指南将指导你如何基于 Docker 一键部署 ShortLink 系统，并配置自动 SSL 证书。

## 1. 准备工作 (Prerequisites)

确保你的服务器满足以下条件：
- **系统**: Linux (Ubuntu/CentOS/Debian)
- **软件**: 
  - Docker Engine (19.03+)
  - Docker Compose (v2.0+)
  - Git
- **域名**: 假设你的域名是 `example.com`，请确保 A 记录已指向服务器 IP。

## 2. 部署步骤

### 2.1 拉取代码
```bash
cd /opt  # 或者你喜欢的目录
git clone https://github.com/adrenjc/linkify-st.git
cd linkify-st
```

### 2.2 配置环境变量
复制示例配置文件：
```bash
cp .env.example .env
```
**重要**：务必编辑 `.env` 文件，修改 `JWT_SECRET` 为一个随机的长字符串（这对安全性至关重要）。

### 2.3 配置域名 (Nginx)
我已帮你配置好 `linkify-nginx.conf`，域名指向 `link.adrenjc.cn`。

### 2.4 首次启动 (HTTP 模式)
先启动服务，让 Nginx 监听 80 端口，以便 Certbot 能进行验证。
```bash
# 如果服务器上有其他程序占用 80 端口 (如 Apache/Nginx)，请先停止它们
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl stop apache2 2>/dev/null || true

docker-compose up -d
```
此时，你应该能通过 `http://link.adrenjc.cn` 访问网站。

### 2.5 申请 SSL 证书
运行以下命令让 Certbot 容器申请证书：
```bash
docker-compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot -d link.adrenjc.cn
```
如果出现 "Congratulations!" 字样，说明证书申请成功。

### 2.6 开启 HTTPS (修改 Nginx 配置)
再次编辑 `linkify-nginx.conf`，添加（或取消注释）443 端口的监听配置。

在文件末尾（`http { ... }` 块内）添加以下内容：

```nginx
    # HTTPS 主站点配置
    server {
        listen 443 ssl http2;
        server_name link.adrenjc.cn;

        ssl_certificate /etc/letsencrypt/live/link.adrenjc.cn/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/link.adrenjc.cn/privkey.pem;

        # 1. 前端代理
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # 2. 后端 API 代理
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # 3. 短链跳转
        location ~* ^/r/(.+)$ {
            proxy_pass http://backend/api/r/$1;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
```

### 2.7 重启 Nginx
```bash
docker-compose restart nginx
```
现在，访问 `https://example.com` 应该可以看到安全锁标志了！🔒

## 3. 日常维护

- **查看日志**: `docker-compose logs -f`
- **更新代码**: 
  ```bash
  git pull
  docker-compose up -d --build  # 重建并重启容器
  ```
- **证书续期**: 系统会自动运行（Certbot 容器每 12 小时检查一次并自动续期）。
