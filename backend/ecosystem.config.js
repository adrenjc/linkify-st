module.exports = {
  apps: [
    {
      name: "shortlink-backend",
      script: "./server.js",

      // 进程配置
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",

      // 环境变量
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // 日志配置
      error_file: "/logs/err.log",
      out_file: "/logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
      log_type: "json",

      // 重启策略
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 1000,

      // 优雅关闭配置
      kill_timeout: 3000,
      wait_ready: false,
      
      // 性能监控
      status_interval: 60000,
      
      // Node 参数
      node_args: [
        "--max-old-space-size=1024", 
      ],
    },
  ],
}
