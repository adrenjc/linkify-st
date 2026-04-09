const mongoose = require("mongoose")

const parsePoolSize = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const mongoMaxPoolSize = parsePoolSize(process.env.MONGO_MAX_POOL_SIZE, 10)
const mongoMinPoolSize = Math.min(
  parsePoolSize(process.env.MONGO_MIN_POOL_SIZE, 0),
  mongoMaxPoolSize
)
const enableMongoCommandMonitoring =
  process.env.MONGO_MONITOR_COMMANDS === "true"

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // 基础配置
      // Mongoose 6+ 默认启用了 useNewUrlParser 和 useUnifiedTopology，此处移除以保持简洁

      // 连接池配置

      maxPoolSize: mongoMaxPoolSize, // 默认降低空闲连接占用

      minPoolSize: mongoMinPoolSize, // 非高并发场景尽量按需建立连接

      // 超时配置

      socketTimeoutMS: 30000, // 降低单个操作超时

      connectTimeoutMS: 10000,

      serverSelectionTimeoutMS: 5000,

      maxIdleTimeMS: 30000,

      // 写入配置

      writeConcern: {
        w: 1, // 只需主节点确认写入

        j: false, // 不要求写入日志

        wtimeout: 5000,
      },

      // 监控和调试

      monitorCommands: enableMongoCommandMonitoring,

      // 事务相关配置需配合 Replica Set 使用，当前配置为单机/混合模式兼容
      retryWrites: false,
    })

    console.log("MongoDB Connected")

    // 连接事件监听

    mongoose.connection.on("connected", () => {
      console.log("Mongoose 已连接")
    })

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose 连接错误:", err)
    })

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose 连接断开")
    })

    // 性能监控

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB 重连成功")
    })

    // 添加全局索引

    await createIndexes()
  } catch (err) {
    console.error("MongoDB 连接失败:", err)

    process.exit(1)
  }
}

// 创建索引函数

async function createIndexes() {
  try {
    const Link = mongoose.model("Link")

    // 创建复合索引

    await Link.collection.createIndex(
      { shortKey: 1 },

      { unique: true, background: true }
    )

    // 创建过期时间索引（如果需要自动清理过期数据）

    await Link.collection.createIndex(
      { createdAt: 1 },

      { expireAfterSeconds: 365 * 24 * 60 * 60, background: true } // 一年后过期
    )

    // 创建常用查询字段的索引

    await Link.collection.createIndex(
      { createdBy: 1, createdAt: -1 },

      { background: true }
    )

    console.log("数据库索引创建成功")
  } catch (error) {
    console.error("创建索引失败:", error)
  }
}

// 添加全局配置（使用新的配置方式）

if (process.env.NODE_ENV === "development") {
  mongoose.set("debug", true) // 开发环境启用调试
}

module.exports = connectDB
