# ShortLink Deployment Log

## Status
- **Docker**: Building Frontend (In Progress)
- **Nginx**: Configured & Tested (Syntax OK)
- **SSL**: Pending Certbot execution

## Deployment Steps
1. **Docker Config**: Updated to build frontend from source, listen on port 8080.
2. **Server Sync**: Cloned repo, updated configs.
3. **Nginx Proxy**: Created `/etc/nginx/sites-available/link.adrenjc.cn` to proxy to `127.0.0.1:8080`.
4. **Validation**: `nginx -t` passed. Warnings about existing `api.adrenjc.cn` noted (safe to ignore).

## Next
- Reload Nginx.
- Run Certbot for SSL.
- Wait for Docker to finish build.
