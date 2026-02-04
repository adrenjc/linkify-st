const { exec } = require("child_process")
const util = require("util")
const execAsync = util.promisify(exec)
const fs = require("fs").promises
const path = require("path")
const Domain = require("../models/Domain")
const { createAuditLog } = require("../controllers/auditLog")
const { ACTION_TYPES, RESOURCE_TYPES } = require("../constants/auditLogTypes")

class SSLService {
  constructor() {
    // 容器内挂载的动态 Nginx 配置目录
    this.nginxConfigDir = "/etc/nginx/conf.d/domains"
    this.skipSSLGeneration = process.env.NODE_ENV === "development"
    this.certEmail = process.env.CERT_EMAIL || "adren@adrenjc.cn"
  }

  async initialize() {
    if (this.skipSSLGeneration) {
      console.log("开发环境：跳过 SSL 服务辅助初始化")
      return
    }

    try {
      await fs.mkdir(this.nginxConfigDir, { recursive: true })
      // 启动时自动修复缺失的配置文件
      this.processVerifiedDomains().catch(console.error)
    } catch (error) {
      console.error("Failed to create Nginx config directory:", error)
    }
  }

  async processVerifiedDomains() {
    try {
      const domains = await Domain.find({ verified: true })
      for (const domainDoc of domains) {
        const domain = domainDoc.domain
        const configPath = path.join(this.nginxConfigDir, `${domain}.conf`)
        
        try {
          await fs.access(configPath)
        } catch (e) {
          console.log(`正在为已验证域名 ${domain} 补全缺失的 Nginx 配置...`)
          // 如果证书已存在，直接生成 HTTPS 配置，否则生成临时配置
          try {
            await fs.access(`/etc/letsencrypt/live/${domain}/fullchain.pem`)
            const config = this.generateNginxConfig(domain)
            await fs.writeFile(configPath, config)
          } catch (certError) {
            // 证书也不存在，走申请流程
            this.requestCertificate(domain).catch(console.error)
          }
        }
      }
      await execAsync("docker exec linkify-nginx nginx -s reload").catch(() => {})
    } catch (error) {
      console.error("Error processing verified domains:", error)
    }
  }

  /**
   * 为域名生成 Nginx 配置文件内容
   */
  generateNginxConfig(domain) {
    return `
# SSL configuration for ${domain}
server {
    listen 80;
    server_name ${domain};
    
    # ACME challenge - 用于 Let's Encrypt 证书验证 (共享卷)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    # 全部重定向到 HTTPS (如果证书已就绪)
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${domain};
    
    # 路径匹配容器内 nginx 的挂载路径
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    
    # 短链跳转接口
    location ~* ^/r/(.+)$ {
        proxy_pass http://backend:5000/api/r/$1;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $http_host;

        proxy_no_cache 1;
        proxy_cache_bypass 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "-1";

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;

        limit_req zone=redirect burst=200 nodelay;
    }

    location / {
        return 404;
    }
}
`
  }

  async requestCertificate(domain) {
    if (this.skipSSLGeneration) {
      console.log(`开发环境：跳过为 ${domain} 生成 SSL 证书`)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      await Domain.findOneAndUpdate(
        { domain },
        {
          "sslCertificate.issuedAt": new Date(),
          "sslCertificate.expiresAt": expiresAt,
          "sslCertificate.status": "active",
        }
      )
      return true
    }

    try {
      console.log(`开始为 ${domain} 自动化申请证书过程...`)

      // 1. 先生成一个仅包含 80 端口和 ACME 验证的临时配置 (防止因证书不存在导致 nginx 重载失败)
      const tempConfig = `
server {
    listen 80;
    server_name ${domain};
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    location / { return 404; }
}
`
      await fs.writeFile(path.join(this.nginxConfigDir, `${domain}.conf`), tempConfig)
      
      // 2. 告诉 Nginx 重载配置以便处理 challenge
      await execAsync("docker exec linkify-nginx nginx -s reload")

      // 3. 调用 Certbot 容器申请证书
      console.log(`正在调用 Certbot 容器为 ${domain} 申请证书...`)
      const { stdout, stderr } = await execAsync(
        `docker exec linkify-certbot certbot certonly --webroot --webroot-path /var/www/certbot -d ${domain} --non-interactive --agree-tos --email ${this.certEmail}`
      )
      console.log("Certbot 输出:", stdout)
      if (stderr) console.warn("Certbot 警告:", stderr)

      // 4. 校验证书文件是否生成 (在 backend 挂载的 cert_data 下检查)
      // 注意：backend 的挂载点是 /etc/letsencrypt
      try {
        await fs.access(`/etc/letsencrypt/live/${domain}/fullchain.pem`)
      } catch (e) {
        throw new Error(`证书文件未成功生成: ${e.message}`)
      }

      // 5. 写入完整的 HTTPS Nginx 配置
      const fullConfig = this.generateNginxConfig(domain)
      await fs.writeFile(path.join(this.nginxConfigDir, `${domain}.conf`), fullConfig)

      // 6. 再次重载 Nginx
      await execAsync("docker exec linkify-nginx nginx -s reload")

      // 7. 更新数据库状态
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90) // 粗略估计

      await Domain.findOneAndUpdate(
        { domain },
        {
          "sslCertificate.issuedAt": new Date(),
          "sslCertificate.expiresAt": expiresAt,
          "sslCertificate.status": "active",
          "sslCertificate.lastRenewalAttempt": new Date(),
          "sslCertificate.renewalError": null,
        }
      )

      console.log(`域名 ${domain} 的 SSL 证书已自动生效`)
      return true
    } catch (error) {
      console.error(`申请证书失败 ${domain}:`, error)
      await Domain.findOneAndUpdate(
        { domain },
        {
          "sslCertificate.lastRenewalAttempt": new Date(),
          "sslCertificate.renewalError": error.message,
        }
      )
      return false
    }
  }

  async setupAutoRenewal() {
    // Docker 中的 Certbot sidecar 已经在其 entrypoint 中处理了自动续期 (certbot renew)
    // 后端只需定时同步数据库中的过期时间即可
    setInterval(async () => {
      if (this.skipSSLGeneration) return
      
      try {
        const domains = await Domain.find({ "sslCertificate.status": "active" })
        for (const domain of domains) {
          // 这里可以添加逻辑定期检查 /etc/letsencrypt 下文件的真实过期时间并回写数据库
          // 为了简化，目前依赖 Certbot 自身的续期机制
        }
      } catch (error) {
        console.error("Error in SSL status sync:", error)
      }
    }, 24 * 60 * 60 * 1000)
  }

  async checkCertificateStatus(domain) {
    const domainDoc = await Domain.findOne({ domain })
    if (!domainDoc?.sslCertificate?.expiresAt) return "pending"

    const now = new Date()
    const expiresAt = new Date(domainDoc.sslCertificate.expiresAt)
    const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry <= 0) return "expired"
    if (daysUntilExpiry <= 30) return "renewal-needed"
    return "active"
  }

  async renewCertificate(domain, userId) {
    if (this.skipSSLGeneration) return Promise.resolve()

    try {
      // 触发续期
      await execAsync(`docker exec linkify-certbot certbot renew --cert-name ${domain} --non-interactive`)
      await execAsync("docker exec linkify-nginx nginx -s reload")
      
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 90)

      await Domain.findOneAndUpdate(
        { domain },
        {
          "sslCertificate.issuedAt": new Date(),
          "sslCertificate.expiresAt": expiresAt,
          "sslCertificate.status": "active",
          "sslCertificate.lastRenewalAttempt": new Date(),
          "sslCertificate.renewalError": null,
        }
      )

      await createAuditLog({
        userId,
        action: ACTION_TYPES.SSL_CERTIFICATE_RENEWED,
        resourceType: RESOURCE_TYPES.DOMAIN,
        description: `手动更新了域名 ${domain} 的 SSL 证书`,
        metadata: { domain },
      })
      return true
    } catch (error) {
      console.error(`续期失败 ${domain}:`, error)
      throw error
    }
  }
}

module.exports = new SSLService()
