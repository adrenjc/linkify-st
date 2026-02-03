const AuditLog = require("../models/AuditLog")
const User = require("../models/User")

/**
 * 从请求中获取客户端真实IP地址
 * @param {object} req - 请求对象
 * @returns {string} - 真实IP地址
 */
const getClientIp = (req) => {
  // 从各种可能的请求头中获取
  const xForwardedFor = req.headers["x-forwarded-for"]
  const realIp = req.headers["x-real-ip"]

  if (xForwardedFor) {
    // X-Forwarded-For 可能包含多个IP，第一个是客户端真实IP
    const ips = xForwardedFor.split(",").map((ip) => ip.trim())
    return ips[0] || realIp || req.ip || "unknown"
  }

  return realIp || req.ip || "unknown"
}

// 创建审计日志
const createAuditLog = async ({
  userId,
  action,
  resourceType,
  resourceId,
  description,
  metadata = {},
  req,
  status = "SUCCESS",
  errorMessage = null,
  session = null,
}) => {
  try {
    /*
     * 检查是否为隐藏管理员用户
     * 隐藏管理员的行为不会被记录到审计日志中
     */
    if (userId) {
      const user = await User.findById(userId).select("isHidden")
      if (user && user.isHidden) {
        return // 隐藏管理员的行为不记录日志
      }
    }

    const auditLog = new AuditLog({
      userId,
      action,
      resourceType,
      resourceId,
      description,
      metadata,
      ipAddress: getClientIp(req),
      userAgent: req.get("user-agent"),
      status,
      errorMessage,
      deviceInfo: {
        browser: req.get("user-agent"),
        os: req.get("user-agent"),
        device: req.get("user-agent"),
      },
    })

    if (session) {
      await auditLog.save({ session })
    } else {
      await auditLog.save()
    }
  } catch (error) {
    console.error("审计日志创建失败:", error)
  }
}

// 获取审计日志列表
const getAuditLogs = async (req, res) => {
  try {
    const {
      current = 1,
      pageSize = 10,
      userId,
      action,
      startDate,
      endDate,
      resourceType,
      description,
      status,
      sort = "createdAt",
      order = "descend",
    } = req.query

    const query = {}

    // 构建查询条件
    if (userId) {
      // 支持用户名模糊搜索，同时过滤掉隐藏管理员
      const users = await User.find({
        username: { $regex: userId, $options: "i" },
        isHidden: { $ne: true },
      }).select("_id")
      query.userId = { $in: users.map((user) => user._id) }
    } else {
      // 如果没有指定用户ID，则过滤掉所有隐藏管理员的记录
      const hiddenUsers = await User.find({ isHidden: true }).select("_id")
      if (hiddenUsers.length > 0) {
        query.userId = { $nin: hiddenUsers.map((user) => user._id) }
      }
    }

    if (action) {
      query.action = action
    }

    if (resourceType) {
      query.resourceType = resourceType
    }

    if (description) {
      query.description = { $regex: description, $options: "i" }
    }

    // 添加状态查询条件
    if (status) {
      query.status = status
    }

    // 处理日期范围查询
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        // 设置开始日期为当天的 00:00:00
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        query.createdAt.$gte = start
      }
      if (endDate) {
        // 设置结束日期为当天的 23:59:59
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.createdAt.$lte = end
      }
    }

    // 构建排序条件
    const sortOptions = {
      [sort]: order === "ascend" ? 1 : -1,
    }

    const skip = (parseInt(current) - 1) * parseInt(pageSize)

    // 使用 Promise.all 并行执行查询
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("userId", "username nickname")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(pageSize)),
      AuditLog.countDocuments(query),
    ])

    res.json({
      success: true,
      data: logs,
      total,
      page: parseInt(current),
      pageSize: parseInt(pageSize),
    })
  } catch (error) {
    console.error("获取审计日志失败:", error)
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    })
  }
}

// 获取审计日志统计信息
const getAuditLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const query = {}
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const stats = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            action: "$action",
            resourceType: "$resourceType",
          },
          count: { $sum: 1 },
        },
      },
    ])

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("获取审计日志统计失败:", error)
    res.status(500).json({ success: false, message: "服务器错误" })
  }
}

// 按国家/地区统计短链点击（可选过滤时间范围、是否排除爬虫）
const getCountryStats = async (req, res) => {
  try {
    const { startDate, endDate, excludeBots = "true" } = req.query
    const match = { action: "CLICK_LINK", resourceType: "LINK" }

    if (excludeBots === "true") {
      match["metadata.isBot"] = { $ne: true }
    }

    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            country: { $ifNull: ["$metadata.country", "UNKNOWN"] },
            isMainlandChina: { $ifNull: ["$metadata.isMainlandChina", false] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          country: "$_id.country",
          isMainlandChina: "$_id.isMainlandChina",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]

    const results = await AuditLog.aggregate(pipeline)

    const total = results.reduce((sum, r) => sum + (r.count || 0), 0)
    const mainland = results
      .filter((r) => r.isMainlandChina === true)
      .reduce((sum, r) => sum + r.count, 0)

    res.json({
      success: true,
      data: {
        total,
        mainland,
        nonMainland: total - mainland,
        byCountry: results,
      },
    })
  } catch (error) {
    console.error("获取国家统计失败:", error)
    res.status(500).json({ success: false, message: "服务器错误" })
  }
}

// 按 IP 统计
const getIPStats = async (req, res) => {
  try {
    const { startDate, endDate, excludeBots = "true" } = req.query
    const match = { action: "CLICK_LINK", resourceType: "LINK" }

    if (excludeBots === "true") {
      match["metadata.isBot"] = { $ne: true }
    }

    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }

    const results = await AuditLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            ipAddress: "$ipAddress",
            country: { $ifNull: ["$metadata.country", "UNKNOWN"] },
            region: { $ifNull: ["$metadata.region", null] },
            city: { $ifNull: ["$metadata.city", null] },
            isMainlandChina: { $ifNull: ["$metadata.isMainlandChina", false] },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          ipAddress: "$_id.ipAddress",
          country: "$_id.country",
          region: "$_id.region",
          city: "$_id.city",
          isMainlandChina: "$_id.isMainlandChina",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ])

    const totalUniqueIPs = results.length
    const mainlandUniqueIPs = results.filter((r) => r.isMainlandChina).length
    const total = results.reduce((s, r) => s + r.count, 0)
    const mainland = results
      .filter((r) => r.isMainlandChina)
      .reduce((s, r) => s + r.count, 0)

    res.json({
      success: true,
      data: {
        total,
        mainland,
        nonMainland: total - mainland,
        totalUniqueIPs,
        mainlandUniqueIPs,
        byIP: results,
      },
    })
  } catch (error) {
    console.error("获取 IP 统计失败:", error)
    res.status(500).json({ success: false, message: "服务器错误" })
  }
}

// 按 Referer 统计
const getRefererStats = async (req, res) => {
  try {
    const { startDate, endDate, excludeBots = "true" } = req.query
    const match = { action: "CLICK_LINK", resourceType: "LINK" }

    if (excludeBots === "true") {
      match["metadata.isBot"] = { $ne: true }
    }

    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }

    const results = await AuditLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            referer: { $ifNull: ["$metadata.referer", "direct"] },
            country: { $ifNull: ["$metadata.country", "UNKNOWN"] },
            isMainlandChina: { $ifNull: ["$metadata.isMainlandChina", false] },
          },
          count: { $sum: 1 },
          uniqueIPs: { $addToSet: "$ipAddress" },
        },
      },
      {
        $project: {
          _id: 0,
          referer: "$_id.referer",
          country: "$_id.country",
          isMainlandChina: "$_id.isMainlandChina",
          count: 1,
          uniqueIPCount: { $size: "$uniqueIPs" },
        },
      },
      { $sort: { count: -1 } },
    ])

    const total = results.reduce((sum, r) => sum + r.count, 0)
    const mainland = results
      .filter((r) => r.isMainlandChina)
      .reduce((sum, r) => sum + r.count, 0)
    const nonMainland = total - mainland

    res.json({
      success: true,
      data: {
        total,
        mainland,
        nonMainland,
        byReferer: results,
      },
    })
  } catch (err) {
    console.error("获取Referer统计错误:", err)
    res.status(500).json({ success: false, message: "服务器错误" })
  }
}

module.exports = {
  createAuditLog,
  getAuditLogs,
  getAuditLogStats,
  getCountryStats,
  getIPStats,
  getRefererStats,
}
