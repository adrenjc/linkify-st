const mongoose = require("mongoose")
const Link = require("../src/models/Link")
const path = require("path")

// 从根目录加载环境配置
require("dotenv").config({ path: path.join(__dirname, "../.env") })

const migrateLinksToArray = async () => {
  try {
    // 连接数据库
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/shortlink",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )

    console.log("开始迁移短链数据...")

    // 查找所有还有longUrl字段的文档
    const links = await mongoose.connection.db
      .collection("links")
      .find({
        longUrl: { $exists: true },
        longUrls: { $exists: false },
      })
      .toArray()

    console.log(`找到 ${links.length} 个需要迁移的短链记录`)

    if (links.length === 0) {
      console.log("没有需要迁移的数据")
      return
    }

    // 批量更新
    const bulkOps = links.map((link) => ({
      updateOne: {
        filter: { _id: link._id },
        update: {
          $set: {
            longUrls: [link.longUrl], // 将单个URL转换为数组
          },
          $unset: {
            longUrl: "", // 移除旧字段
          },
        },
      },
    }))

    const result = await mongoose.connection.db
      .collection("links")
      .bulkWrite(bulkOps)

    console.log(`迁移完成！更新了 ${result.modifiedCount} 个记录`)

    // 验证迁移结果
    const remainingOldFormat = await mongoose.connection.db
      .collection("links")
      .countDocuments({
        longUrl: { $exists: true },
      })

    const newFormat = await mongoose.connection.db
      .collection("links")
      .countDocuments({
        longUrls: { $exists: true, $type: "array" },
      })

    console.log(`迁移验证：`)
    console.log(`- 剩余旧格式记录: ${remainingOldFormat}`)
    console.log(`- 新格式记录: ${newFormat}`)

    if (remainingOldFormat === 0) {
      console.log("✅ 所有数据迁移成功！")
    } else {
      console.log("⚠️  还有一些记录未迁移，请检查数据")
    }
  } catch (error) {
    console.error("迁移过程中发生错误:", error)
  } finally {
    await mongoose.connection.close()
    console.log("数据库连接已关闭")
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateLinksToArray()
    .then(() => {
      console.log("迁移脚本执行完成")
      process.exit(0)
    })
    .catch((error) => {
      console.error("迁移脚本执行失败:", error)
      process.exit(1)
    })
}

module.exports = migrateLinksToArray
