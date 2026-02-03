# 自定义域名 HTTPS 自动化实现原理分析

## 1. 原理概述

本项目实现“自定义域名支持 HTTPS”的核心思路是：**通过 Node.js 后端脚本化控制基础设施**。

简单来说，当用户添加一个域名时，系统会自动执行运维人员平时手动执行的操作：验证域名 -> 申请证书 -> 写 Nginx 配置 -> 重载 Nginx。这一套流程通过代码完全自动化了。

主要涉及三个核心组件：
1.  **Nginx**：作为流量入口和反向代理，负责 SSL 终结。
2.  **acme.sh**：一个开源的 Shell 脚本工具，用于向 Let's Encrypt 自动申请和续期免费 SSL 证书。
3.  **Node.js 后端**：负责编排整个流程，通过系统命令（`child_process`）控制上述两个组件。

---

## 2. 核心实现流程

整个功能的生命周期分为四个关键步骤：

### 第一步：所有权验证 (DNS TXT)
**目的**：防止恶意用户绑定别人的域名。
**实现**：
1.  用户在前端请求添加域名。
2.  后端生成一个随机的 `verificationCode`。
3.  用户需要在自己的 DNS 解析处添加一条 TXT 记录。
4.  后端通过 Node.js 的 `dns` 模块查询该 TXT 记录，比对通过后才允许进行后续操作。

### 第二步：申请 SSL 证书
**目的**：获取合法的 HTTPS 证书。
**实现**：
后端调用系统命令，使用 `acme.sh` 工具申请证书。
```bash
# 核心命令示例
acme.sh --issue -d example.com -w /var/www/html --force
```
这里使用的是 `webroot` 验证模式，Let's Encrypt 会访问 `http://example.com/.well-known/acme-challenge/` 来验证文件。

### 第三步：动态生成 Nginx 配置
**目的**：让 Nginx 识别新域名并挂载证书。
**实现**：
1.  代码中预定义了一个 Nginx `server` 配置模板。
2.  将域名、证书路径填充进模板。
3.  将生成的配置文件写入 `/etc/nginx/ssl/domains/域名.conf`。

### 第四步：生效 (Nginx Reload)
**目的**：应用新的配置。
**实现**：
后端执行 `sudo systemctl reload nginx`，让 Nginx 重新加载配置，新域名即可通过 HTTPS 访问。

---

## 3. 关键代码解析

### 3.1 Nginx 基础配置 (`nginx/nginx.conf`)
Nginx 开启了一个“挂载点”，用于加载所有动态生成的域名配置。

```nginx
http {
    # ... 其他配置 ...

    # 通配符服务器 - 处理 ACME 验证请求
    server {
        listen 80 default_server;
        # 处理 Let's Encrypt 的验证请求
        location /.well-known/acme-challenge/ {
            root /var/www/html;
            try_files $uri =404;
        }
    }

    # 关键点：引入自动生成的自定义域名配置
    include /etc/nginx/ssl/domains/*.conf;
}
```

### 3.2 证书申请服务 (`src/services/sslService.js`)
这是核心逻辑所在，使用了 `child_process` 执行 Shell 命令。

```javascript
async requestCertificate(domain) {
    // 1. 创建证书目录
    await execAsync(`sudo mkdir -p ${this.sslDir}/${domain}`)

    // 2. 调用 acme.sh 申请证书
    // -w /var/www/html 对应 Nginx 中的 webroot 路径
    await execAsync(
        `sudo /root/.acme.sh/acme.sh --issue -d ${domain} -w /var/www/html --force --debug`
    )

    // 3. 安装证书 (将证书文件复制到指定目录)
    await execAsync(`
        sudo /root/.acme.sh/acme.sh --install-cert -d ${domain} \
        --key-file ${this.sslDir}/${domain}/key.pem \
        --fullchain-file ${this.sslDir}/${domain}/fullchain.pem \
        --reloadcmd "systemctl reload nginx"
    `)

    // 4. 生成并写入 Nginx 配置文件
    const nginxConfig = `...` // Nginx 配置模板
    await execAsync(
        `sudo tee ${this.sslDir}/${domain}.conf > /dev/null << 'EOL'\n${nginxConfig}\nEOL`
    )

    // 5. 重载 Nginx
    await execAsync("sudo systemctl reload nginx")
}
```

### 3.3 自动续期
系统配置了双重保障：
1.  `acme.sh` 自带的 Cron Job（系统级）。
2.  Node.js 代码中的 `setInterval`（应用级），每天检查证书有效期，快过期时触发更新。

---

## 4. 优缺点与适用场景

### 优点
*   **全自动化体验**：用户无需手动上传证书，无需人工介入。
*   **零成本**：利用 Let's Encrypt 免费证书。
*   **灵活性**：每个域名拥有独立的 Nginx 配置，互不干扰。

### 缺点/风险
*   **权限要求高**：Node.js 进程需要执行 `sudo` 命令，存在一定的安全隐患。如果后端代码存在命令注入漏洞，攻击者可能获取服务器 Root 权限。
*   **单机限制**：当前实现将文件写在本地磁盘，仅适用于单机 Docker 部署。如果扩展到多台服务器集群，需要引入共享存储（如 NFS）或改用网关型架构（如 APISIX）。
*   **依赖外部环境**：强依赖宿主机安装了 `acme.sh` 和 `nginx` 且路径正确。

## 5. 总结
这是一个非常经典的“单体应用自动化运维”实现方案。它通过代码将繁琐的 HTTPS 申请配置流程封闭起来，为 SaaS 类的短链接系统提供了极佳的用户体验。
