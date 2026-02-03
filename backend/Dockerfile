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

FROM keymetrics/pm2:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create logs directory
RUN mkdir -p /logs

# Expose port (ecosystem.config.js uses 8080 by default in env, but compose expects 5000? Let's check deploy.sh/compose)
# deploy.sh says "后端 API 地址: http://localhost:5000" and upstream is 5000. 
# ecosystem.config.js sets PORT: 8080. This is a mismatch.
# I will override PORT in Docker ENV to 5000 to match expectation.
ENV PORT=5000
EXPOSE 5000

# Start with pm2-runtime
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
