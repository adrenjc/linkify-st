const Link = require("../models/Link")
const { createAuditLog } = require("./auditLog")
const { ACTION_TYPES, RESOURCE_TYPES } = require("../constants/auditLogTypes")
const {
  getAsync,
  setAsync,
  delAsync,
  evalAsync,
  hgetallAsync,
} = require("../config/redis")
const AuditLog = require("../models/AuditLog")
const {
  formatIpAddress,
  parseUserAgent,
  formatReferer,
} = require("../utils/formatter")
const { PERMISSION_CODES } = require("../constants/permissions")
const { escapeRegExp } = require("../utils/escapeRegExp")
const geoip = require("geoip-lite")

const generateShortKey = (longUrl) => {
  // 使用时间戳和长链接生成短链接
  const timestamp = Date.now()
  return Buffer.from(`${longUrl}-${timestamp}`).toString("base64").slice(-6)
}

/**
 * 使用Redis Lua脚本实现原子选择最小计数并自增
 * 计数键采用哈希结构：balance:{domain}:{shortKey}，field为索引
 * @param {string} domain - 域名
 * @param {string} shortKey - 短链接key
 * @param {string[]} longUrls - 原始链接数组
 * @returns {Promise<string>} 选中的URL
 */
const selectUrlWithBalancedDistribution = async (
  domain,
  shortKey,
  longUrls
) => {
  try {
    if (longUrls.length === 1) {
      return longUrls[0]
    }

    const hashKey = `balance:${domain}:${shortKey}`
    const seqKey = `balance:${domain}:${shortKey}:seq`
    const expireSeconds = 30 * 24 * 3600

    const luaScript = `
      local hashKey = KEYS[1]
      local seqKey = KEYS[2]
      local n = tonumber(ARGV[1])
      local expireSec = tonumber(ARGV[2])

      local min = nil
      local candidates = {}
      for i = 0, n - 1 do
        local c = tonumber(redis.call('HGET', hashKey, tostring(i)) or '0')
        if (min == nil) or (c < min) then
          min = c
          candidates = { i }
        elseif c == min then
          table.insert(candidates, i)
        end
      end

      local seq = redis.call('INCR', seqKey)
      local idx = ((seq - 1) % #candidates) + 1
      local selected = candidates[idx]
      redis.call('HINCRBY', hashKey, tostring(selected), 1)

      if expireSec > 0 then
        if redis.call('TTL', hashKey) < 0 then
          redis.call('EXPIRE', hashKey, expireSec)
        end
        if redis.call('TTL', seqKey) < 0 then
          redis.call('EXPIRE', seqKey, expireSec)
        end
      end

      return tostring(selected)
    `

    const selectedIndexStr = await evalAsync(
      luaScript,
      2,
      hashKey,
      seqKey,
      String(longUrls.length),
      String(expireSeconds)
    )
    const selectedIndex = parseInt(selectedIndexStr, 10)
    return longUrls[selectedIndex]
  } catch (error) {
    console.error("均匀分布选择失败，回退到随机选择:", error)
    const randomIndex = Math.floor(Math.random() * longUrls.length)
    return longUrls[randomIndex]
  }
}

/**
 * 获取短链接的URL均匀分布统计
 * @param {string} shortKey - 短链接key
 * @param {string[]} longUrls - 原始链接数组
 * @returns {Promise<Object>} 分布统计信息
 */
const getUrlDistributionStats = async (domain, shortKey, longUrls) => {
  try {
    const stats = []
    let totalCount = 0

    const hashKey = `balance:${domain}:${shortKey}`
    const allCounts = (await hgetallAsync(hashKey)) || {}

    for (let i = 0; i < longUrls.length; i++) {
      const urlCount = parseInt(allCounts?.[String(i)] || "0") || 0
      totalCount += urlCount
      stats.push({ index: i, url: longUrls[i], count: urlCount })
    }

    // 计算百分比
    const statsWithPercentage = stats.map((stat) => ({
      ...stat,
      percentage:
        totalCount > 0 ? ((stat.count / totalCount) * 100).toFixed(2) : "0.00",
    }))

    return {
      shortKey,
      totalCount,
      urlCount: longUrls.length,
      stats: statsWithPercentage,
      isBalanced:
        totalCount > 0
          ? isDistributionBalanced(stats.map((s) => s.count))
          : true,
    }
  } catch (error) {
    console.error("获取分布统计失败:", error)
    return null
  }
}

/**
 * 检查分布是否均匀（最大值与最小值的差不超过1）
 * @param {number[]} counts - 计数数组
 * @returns {boolean} 是否均匀
 */
const isDistributionBalanced = (counts) => {
  if (counts.length <= 1) return true
  const max = Math.max(...counts)
  const min = Math.min(...counts)
  return max - min <= 1
}

const createShortLink = async (req, res) => {
  const { longUrls, customDomain, customShortKey, remark } = req.body
  const isDev = process.env.NODE_ENV === "development"

  console.log("Received request body:", req.body)

  // 支持单个longUrl或longUrls数组，向后兼容
  let urlsArray = []
  if (req.body.longUrl) {
    // 向后兼容单个longUrl
    urlsArray = [req.body.longUrl]
  } else if (longUrls && Array.isArray(longUrls)) {
    urlsArray = longUrls.filter((url) => url && url.trim() !== "")
  }

  if (!urlsArray || urlsArray.length === 0) {
    return res
      .status(400)
      .send({ success: false, message: "至少需要一个原始链接" })
  }

  // 验证所有URL格式
  const urlRegex = /^https?:\/\/.+/
  for (const url of urlsArray) {
    if (!urlRegex.test(url)) {
      return res.status(400).send({
        success: false,
        message: `无效的URL格式: ${url}`,
      })
    }
  }

  // 验证自定义短链key的格式
  if (
    customShortKey &&
    (customShortKey.length < 4 || customShortKey.length > 6)
  ) {
    return res
      .status(400)
      .send({ success: false, message: "自定义短链key长度必须在4-6位之间" })
  }

  // 验证备注字段长度
  if (remark && remark.length > 256) {
    return res
      .status(400)
      .send({ success: false, message: "备注长度不能超过256个字符" })
  }

  try {
    const shortKey = customShortKey || generateShortKey(urlsArray[0])

    // 检查shortKey是否已存在 (忽略大小写)
    const existingLink = await Link.findOne({
      shortKey: { $regex: new RegExp(`^${escapeRegExp(shortKey)}$`, "i") },
    })
    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: "该短链key已存在，请更换一个",
      })
    }

    // 获取当前域名，并去除 www 前缀
    const currentDomain = req.get("host").replace(/^www\./, "")

    // 开发环境下的处理
    if (isDev) {
      const baseUrl = `http://${currentDomain}/api`
      const newLink = new Link({
        longUrls: urlsArray,
        shortKey,
        customDomain: customDomain || null,
        shortUrl: `${baseUrl}/r/${shortKey}`,
        createdBy: req.user.id,
        domain: customDomain || currentDomain,
        remark: remark || "",
      })
      await newLink.save()

      // 添加审计日志
      await createAuditLog({
        userId: req.user.id,
        action: ACTION_TYPES.CREATE_LINK,
        resourceType: RESOURCE_TYPES.LINK,
        resourceId: newLink._id,
        description: `创建短链接: ${newLink.shortUrl}`,
        metadata: { longUrls: newLink.longUrls, remark: newLink.remark },
        req,
      })

      res.json(newLink)
      return
    }

    // 生产环境的处理
    let baseUrl

    // 检查是否是IP地址访问
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(currentDomain)

    if (customDomain) {
      // 如果有自定义域名，使用 https
      baseUrl = `https://${customDomain}`
    } else if (isIpAddress) {
      // 如果是IP地址访问，使用 http
      baseUrl = `http://${currentDomain}`
    } else {
      // 如果是域名访问，使用 https
      baseUrl = `https://${currentDomain}`
    }

    const newLink = new Link({
      longUrls: urlsArray,
      shortKey,
      customDomain: customDomain || null,
      shortUrl: `${baseUrl}/r/${shortKey}`,
      createdBy: req.user.id,
      domain: customDomain || currentDomain,
      remark: remark || "",
    })

    await newLink.save()

    // 添加审计日志
    await createAuditLog({
      userId: req.user.id,
      action: ACTION_TYPES.CREATE_LINK,
      resourceType: RESOURCE_TYPES.LINK,
      resourceId: newLink._id,
      description: `创建短链接: ${newLink.shortUrl}`,
      metadata: { longUrls: newLink.longUrls, remark: newLink.remark },
      req,
    })

    res.json(newLink)
  } catch (error) {
    // 处理重复短链接的错误
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "该短链接已存在，请重试",
      })
    }
    console.error("创建短链接错误:", error)
    res.status(500).send({ success: false, message: "服务器错误" })
  }
}

const redirectToLongLink = async (req, res) => {
  const { shortKey } = req.params

  try {
    // 检查是否是压力测试请求
    const isLoadTest = req.get("X-Load-Test") === "true"

    // 获取User-Agent
    const userAgent = req.get("user-agent") || ""

    // 检查是否是爬虫/机器人
    const botPatterns = [
      /bot/i,
      /spider/i,
      /crawl/i,
      /slurp/i,
      /baiduspider/i,
      /googlebot/i,
      /yandex/i,
      /bingbot/i,
      /facebookexternalhit/i,
      /semrushbot/i,
      /ahrefsbot/i,
      /mj12bot/i,
      /screaming frog/i,
      /datanyze/i,
      /sogou/i,
      /exabot/i,
      /ia_archiver/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /apache-httpclient/i,
      /go-http-client/i,
    ]

    const isBot = botPatterns.some((pattern) => pattern.test(userAgent))

    // 提取用户真实IP地址
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

    const clientIp = getClientIp(req)
    const geoInfo =
      clientIp && clientIp !== "unknown" ? geoip.lookup(clientIp) : null
    const countryCode = geoInfo?.country || "UNKNOWN"
    const regionCode = geoInfo?.region || null
    const cityName = geoInfo?.city || null
    const isMainlandChina = countryCode === "CN"

    // 1. 尝试从 Redis 缓存中查询链接URL数组
    let cachedUrls = null
    try {
      const cached = await getAsync(`shortlink:${shortKey}`)
      if (cached) {
        cachedUrls = JSON.parse(cached)
      }
    } catch (error) {
      console.error("Redis查询失败，降级到数据库查询:", error)
    }

    // 2. 查找对应的短链接记录
    const link = await Link.findOne({ shortKey })

    // 如果链接不存在，返回404
    if (!link) {
      return res.status(404).send({ success: false, message: "短链接未找到" })
    }

    // 中国大陆IP拦截（悄无声息：直接断开连接，不返回内容，不记录日志）
    if (isMainlandChina) {
      if (typeof res.destroy === "function") {
        res.destroy()
      } else if (res.socket) {
        res.socket.destroy()
      } else if (req.socket) {
        req.socket.destroy()
      }
      return
    }

    // 均匀分布选择原始链接进行跳转（计数按域名+短key区分）
    const selectedUrl = await selectUrlWithBalancedDistribution(
      link.domain,
      shortKey,
      link.longUrls
    )

    // 3. 缓存短链接的目标URL数组 (如果缓存未命中)
    if (!cachedUrls) {
      try {
        await setAsync(
          `shortlink:${shortKey}`,
          JSON.stringify(link.longUrls),
          "EX",
          3600
        )
      } catch (error) {
        console.error("Redis缓存写入失败:", error)
      }
    }

    // 4. 记录点击日志（如果不是爬虫且不是压力测试）
    if (!isBot && !isLoadTest) {
      try {
        // 检查是否是短时间内重复访问
        // 开发环境：30秒去重，生产环境：5分钟去重
        const isDev = process.env.NODE_ENV === "development"
        const dedupTime = isDev ? 30 : 300 // 开发环境30秒，生产环境300秒(5分钟)

        const visitId = `${link.domain}:${shortKey}:${clientIp}`
        const visitKey = `visit:${visitId}`
        const hasRecentVisit = await getAsync(visitKey)

        if (!hasRecentVisit) {
          // 设置访问标记
          await setAsync(visitKey, "1", "EX", dedupTime)

          // 异步记录点击日志
          process.nextTick(async () => {
            try {
              await createAuditLog({
                userId: link.createdBy || "system",
                action: ACTION_TYPES.CLICK_LINK,
                resourceType: RESOURCE_TYPES.LINK,
                resourceId: link._id,
                description: `访问短链接: ${link.shortUrl}`,
                metadata: {
                  longUrls: link.longUrls,
                  selectedUrl: selectedUrl,
                  remark: link.remark,
                  referer: req.get("referer") || "direct",
                  userAgent: userAgent,
                  ipAddress: clientIp,
                  isBot: false,
                  country: countryCode,
                  region: regionCode,
                  city: cityName,
                  isMainlandChina: isMainlandChina,
                },
                req,
                status: "SUCCESS",
              })
            } catch (error) {
              console.error("记录审计日志失败:", error)
            }
          })
        }
      } catch (error) {
        console.error("访问去重检查失败:", error)
        // 发生错误时，降级为不进行去重检查，仍然记录点击
        process.nextTick(async () => {
          try {
            await createAuditLog({
              userId: link.createdBy || "system",
              action: ACTION_TYPES.CLICK_LINK,
              resourceType: RESOURCE_TYPES.LINK,
              resourceId: link._id,
              description: `访问短链接: ${link.shortUrl}`,
              metadata: {
                longUrls: link.longUrls,
                selectedUrl: selectedUrl,
                remark: link.remark,
                referer: req.get("referer") || "direct",
                userAgent: userAgent,
                ipAddress: clientIp,
                isBot: false,
                noDedup: true,
                country: countryCode,
                region: regionCode,
                city: cityName,
                isMainlandChina: isMainlandChina,
              },
              req,
              status: "SUCCESS",
            })
          } catch (error) {
            console.error("记录审计日志失败:", error)
          }
        })
      }
    } else if (isBot) {
      // 如果是爬虫，记录但标记为爬虫访问
      console.log(`爬虫访问: ${userAgent} -> ${shortKey}`)

      // 可选：记录爬虫访问，但不计入点击量统计
      process.nextTick(async () => {
        try {
          await createAuditLog({
            userId: link.createdBy || "system",
            action: ACTION_TYPES.CLICK_LINK,
            resourceType: RESOURCE_TYPES.LINK,
            resourceId: link._id,
            description: `爬虫访问短链接: ${link.shortUrl}`,
            metadata: {
              longUrls: link.longUrls,
              selectedUrl: selectedUrl,
              remark: link.remark,
              referer: req.get("referer") || "direct",
              userAgent: userAgent,
              ipAddress: clientIp,
              isBot: true,
              country: countryCode,
              region: regionCode,
              city: cityName,
              isMainlandChina: isMainlandChina,
            },
            req,
            status: "SUCCESS",
          })
        } catch (error) {
          console.error("记录爬虫审计日志失败:", error)
        }
      })
    }

    return res.redirect(selectedUrl)
  } catch (err) {
    console.error("重定向错误:", err)
    res.status(500).send({ success: false, message: "服务器错误" })
  }
}

// 查询用户所有短链接
const getLinks = async (req, res) => {
  try {
    // 获取 ProTable 传递的分页参数
    const {
      current = 1,
      pageSize = 10,
      shortKey,
      longUrls,
      longUrl,
      remark,
    } = req.query
    const page = parseInt(current, 10)
    const limit = parseInt(pageSize, 10)
    const skip = (page - 1) * limit

    // 构建查询条件
    const query = { createdBy: req.user.id }

    if (shortKey) {
      query.shortKey = { $regex: shortKey, $options: "i" }
    }

    // 支持新的 longUrls 参数名，同时保持对旧 longUrl 参数的向后兼容
    const searchUrl = longUrls || longUrl
    if (searchUrl) {
      query.longUrls = { $elemMatch: { $regex: searchUrl, $options: "i" } }
    }

    if (remark) {
      query.remark = { $regex: remark, $options: "i" }
    }

    // 查询用户的短链接，并应用分页
    const [links, total] = await Promise.all([
      Link.find(query)
        .sort({ createdAt: -1 }) // 按创建时间降序排序
        .skip(skip)
        .limit(limit),
      Link.countDocuments(query),
    ])

    const linkIds = links.map((link) => link._id)

    let clickStatsMap = new Map()
    let urlStatsMap = {}
    let recentClicksMap = new Map()

    if (linkIds.length > 0) {
      const baseMatch = {
        action: ACTION_TYPES.CLICK_LINK,
        resourceId: { $in: linkIds },
        "metadata.isBot": { $ne: true },
      }

      const [clickStats, urlStats, recentLogs] = await Promise.all([
        AuditLog.aggregate([
          { $match: baseMatch },
          {
            $group: {
              _id: "$resourceId",
              clickCount: { $sum: 1 },
              lastClickTime: { $max: "$createdAt" },
            },
          },
        ]),
        AuditLog.aggregate([
          { $match: { ...baseMatch, "metadata.selectedUrl": { $exists: true } } },
          {
            $group: {
              _id: {
                resourceId: "$resourceId",
                selectedUrl: "$metadata.selectedUrl",
              },
              count: { $sum: 1 },
            },
          },
        ]),
        AuditLog.find(baseMatch)
          .sort({ createdAt: -1 })
          .limit(Math.max(linkIds.length * 10, 10)),
      ])

      clickStatsMap = new Map(
        clickStats.map((item) => [
          item._id.toString(),
          {
            clickCount: item.clickCount,
            lastClickTime: item.lastClickTime,
          },
        ])
      )

      urlStatsMap = urlStats.reduce((acc, item) => {
        const key = item._id.resourceId.toString()
        if (!acc[key]) {
          acc[key] = {}
        }
        if (item._id.selectedUrl) {
          acc[key][item._id.selectedUrl] = item.count
        }
        return acc
      }, {})

      recentClicksMap = recentLogs.reduce((acc, log) => {
        const key = log.resourceId.toString()
        if (!acc.has(key)) {
          acc.set(key, [])
        }
        const list = acc.get(key)
        if (list.length < 10) {
          list.push({
            time: log.createdAt,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            targetUrl: log.metadata?.selectedUrl,
          })
        }
        return acc
      }, new Map())
    }

    const linksWithClickInfo = links.map((link) => {
      const idStr = link._id.toString()
      const stats = clickStatsMap.get(idStr) || {}
      const urlStats =
        link.longUrls?.reduce((acc, url) => {
          acc[url] = urlStatsMap?.[idStr]?.[url] || 0
          return acc
        }, {}) || {}

      return {
        ...link.toObject(),
        clickCount: stats.clickCount || 0,
        lastClickTime: stats.lastClickTime || null,
        urlStats,
        recentClicks: recentClicksMap.get(idStr) || [],
      }
    })

    res.json({
      data: linksWithClickInfo,
      success: true,
      total,
    })
  } catch (err) {
    console.error("获取短链接错误:", err)
    res.status(500).send({
      success: false,
      message: "服务器错误",
    })
  }
}

// 查询所有用户的短链接（仅管理员）
const getAllLinks = async (req, res) => {
  try {
    // 获取 ProTable 传递的分页参数
    const {
      current = 1,
      pageSize = 10,
      createdBy,
      shortKey,
      longUrls,
      longUrl,
      remark,
    } = req.query
    const page = parseInt(current, 10)
    const limit = parseInt(pageSize, 10)
    const skip = (page - 1) * limit

    // 构建查询条件
    const query = {}

    if (createdBy) {
      query.createdBy = createdBy
    }

    if (shortKey) {
      query.shortKey = { $regex: shortKey, $options: "i" }
    }

    // 支持新的 longUrls 参数名，同时保持对旧 longUrl 参数的向后兼容
    const searchUrl = longUrls || longUrl
    if (searchUrl) {
      query.longUrls = { $elemMatch: { $regex: searchUrl, $options: "i" } }
    }

    if (remark) {
      query.remark = { $regex: remark, $options: "i" }
    }

    // 获取所有短链接，并查询点击次数相关信息
    const [links, total] = await Promise.all([
      Link.find(query)
        .populate("createdBy", "username nickname email") // 关联查询创建者信息
        .sort({ createdAt: -1 }) // 按创建时间降序排序
        .skip(skip)
        .limit(limit),
      Link.countDocuments(query),
    ])

    // 获取每个链接的点击次数和最近点击时间
    const linksWithClickInfo = await Promise.all(
      links.map(async (link) => {
        // 查询该链接的点击记录（审计日志中的CLICK_LINK记录）
        const clickLogs = await AuditLog.find({
          action: ACTION_TYPES.CLICK_LINK,
          resourceId: link._id,
          "metadata.isBot": { $ne: true }, // 排除标记为爬虫的记录
        })
          .sort({ createdAt: -1 }) // 按时间倒序，最新的在前面
          .limit(10) // 只获取最近10条

        const clickCount = await AuditLog.countDocuments({
          action: ACTION_TYPES.CLICK_LINK,
          resourceId: link._id,
          "metadata.isBot": { $ne: true }, // 排除标记为爬虫的记录
        })

        // 获取每个原始链接的访问统计
        const urlStats = {}
        if (link.longUrls && link.longUrls.length > 0) {
          for (const url of link.longUrls) {
            const urlClickCount = await AuditLog.countDocuments({
              action: ACTION_TYPES.CLICK_LINK,
              resourceId: link._id,
              "metadata.selectedUrl": url,
              "metadata.isBot": { $ne: true },
            })
            urlStats[url] = urlClickCount
          }
        }

        // 获取最近点击时间
        const lastClickTime =
          clickLogs.length > 0 ? clickLogs[0].createdAt : null

        // 转换为普通对象并添加点击信息
        const linkObj = link.toObject()
        return {
          ...linkObj,
          clickCount,
          lastClickTime,
          urlStats, // 新增：每个URL的访问统计
          recentClicks: clickLogs.map((log) => ({
            time: log.createdAt,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            targetUrl: log.metadata?.selectedUrl, // 新增：访问的目标URL
          })),
        }
      })
    )

    res.json({
      data: linksWithClickInfo,
      success: true,
      total,
    })
  } catch (err) {
    console.error("获取所有短链接错误:", err)
    res.status(500).send({
      success: false,
      message: "服务器错误",
    })
  }
}

// 汇总：所有短链是否有中国大陆点击
const getAllLinksMainlandPresence = async (req, res) => {
  try {
    const { startDate, endDate, excludeBots = "true" } = req.query

    // 仅管理员或拥有查看所有权限的用户可访问
    const isAdmin = req.user.username === "admin" || req.user.isAdmin
    const hasViewAllPermission =
      req.user.permissions?.includes(PERMISSION_CODES.LINK_VIEW_ALL) ||
      req.user.roles?.some((role) =>
        role.permissions?.some(
          (perm) => perm.code === PERMISSION_CODES.LINK_VIEW_ALL
        )
      )
    if (!isAdmin && !hasViewAllPermission) {
      return res
        .status(403)
        .json({ success: false, message: "没有权限查看所有短链接统计" })
    }

    // 取出所有链接 id 和简要信息
    const links = await Link.find(
      {},
      { _id: 1, shortUrl: 1, shortKey: 1, createdBy: 1 }
    )

    // 构建日志匹配
    const match = {
      action: ACTION_TYPES.CLICK_LINK,
      resourceType: RESOURCE_TYPES.LINK,
      "metadata.isMainlandChina": true,
    }
    if (excludeBots === "true") match["metadata.isBot"] = { $ne: true }
    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }

    // 聚合统计每个 link 的大陆点击数量
    const agg = await AuditLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$resourceId",
          mainlandClickCount: { $sum: 1 },
        },
      },
    ])

    const idToCount = new Map(
      agg.map((x) => [String(x._id), x.mainlandClickCount])
    )
    const data = links.map((l) => ({
      linkId: l._id,
      shortUrl: l.shortUrl,
      shortKey: l.shortKey,
      hasMainland: (idToCount.get(String(l._id)) || 0) > 0,
      mainlandClickCount: idToCount.get(String(l._id)) || 0,
    }))

    res.json({ success: true, data, total: data.length })
  } catch (error) {
    console.error("获取所有短链大陆点击汇总失败:", error)
    res.status(500).json({ success: false, message: "服务器错误" })
  }
}

// 删除短链接
const deleteLink = async (req, res) => {
  const { id } = req.params

  try {
    // 先查找链接
    const link = await Link.findById(id)

    if (!link) {
      return res.status(404).json({ success: false, message: "链接未找到" })
    }

    // 检查权限 - 确保admin用户有权限
    // 如果用户是admin，直接允许访问，不需要其他检查
    if (req.user.username === "admin" || req.user.isAdmin) {
      console.log("管理员用户，允许删除短链接")
      // 管理员用户，直接删除
      await Link.findByIdAndDelete(id)
    } else {
      // 非管理员用户，检查是否是创建者或有删除所有权限
      const isOwner = link.createdBy.toString() === req.user.id
      const hasDeleteAllPermission =
        req.user.permissions?.includes(PERMISSION_CODES.LINK_MANAGE) ||
        req.user.roles?.some((role) =>
          role.permissions?.some(
            (perm) => perm.code === PERMISSION_CODES.LINK_MANAGE
          )
        )

      if (!isOwner && !hasDeleteAllPermission) {
        return res.status(403).json({
          success: false,
          message: "没有权限删除该短链接",
        })
      }

      // 有权限，执行删除
      await Link.findByIdAndDelete(id)
    }

    // 添加审计日志
    await createAuditLog({
      userId: req.user.id,
      action: ACTION_TYPES.DELETE_LINK,
      resourceType: RESOURCE_TYPES.LINK,
      resourceId: link._id,
      description: `删除短链接: ${link.shortUrl}`,
      metadata: { longUrls: link.longUrls },
      req,
    })

    res.json({ success: true, message: "链接已删除" })
  } catch (err) {
    console.error("删除短链接错误:", err)
    res.status(500).send({ success: false, message: "服务器错误" })
  }
}

// 更新短链接
const updateLink = async (req, res) => {
  try {
    const { id } = req.params
    const { longUrls, customShortKey, remark, customDomain } = req.body

    // 支持单个longUrl或longUrls数组，向后兼容
    let urlsArray = []
    if (req.body.longUrl) {
      // 向后兼容单个longUrl
      urlsArray = [req.body.longUrl]
    } else if (longUrls && Array.isArray(longUrls)) {
      urlsArray = longUrls.filter((url) => url && url.trim() !== "")
    }

    // 验证URL数组
    if (urlsArray && urlsArray.length > 0) {
      const urlRegex = /^https?:\/\/.+/
      for (const url of urlsArray) {
        if (!urlRegex.test(url)) {
          return res.status(400).json({
            success: false,
            message: `无效的URL格式: ${url}`,
          })
        }
      }
    }

    // 查找短链接
    const link = await Link.findById(id)

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "短链接不存在",
      })
    }

    // 检查权限 - 确保admin用户有权限
    // 如果用户是admin，直接允许访问，不需要其他检查
    if (req.user.username === "admin" || req.user.isAdmin) {
      console.log("管理员用户，允许修改短链接")
      // 管理员用户，直接允许访问
    } else {
      // 非管理员用户，检查是否是创建者或有更新所有权限
      const isOwner = link.createdBy.toString() === req.user.id
      const hasUpdateAllPermission =
        req.user.permissions?.includes(PERMISSION_CODES.LINK_VIEW_ALL) ||
        req.user.roles?.some((role) =>
          role.permissions?.some(
            (perm) => perm.code === PERMISSION_CODES.LINK_VIEW_ALL
          )
        )

      if (!isOwner && !hasUpdateAllPermission) {
        return res.status(403).json({
          success: false,
          message: "没有权限修改该短链接",
        })
      }
    }

    // 保存修改前的数据，用于审计日志与计数键清理
    const oldLongUrls = [...link.longUrls]
    const oldRemark = link.remark
    const oldCustomShortKey = link.shortKey
    const oldCustomDomain = link.customDomain
    const oldDomainValue = link.domain

    // 检查shortKey是否有变化，如果有变化，则检查是否已存在
    if (customShortKey && customShortKey !== link.shortKey) {
      const existingLink = await Link.findOne({
        shortKey: {
          $regex: new RegExp(`^${escapeRegExp(customShortKey)}$`, "i"),
        },
        customDomain: customDomain || link.customDomain,
        _id: { $ne: id }, // 排除当前链接
      })

      if (existingLink) {
        return res.status(400).json({
          success: false,
          message: "该短链key已存在，请更换一个",
        })
      }

      // 更新shortKey和shortUrl
      link.shortKey = customShortKey
    }

    // 更新其他字段
    if (urlsArray && urlsArray.length > 0) {
      link.longUrls = urlsArray
    }

    if (remark !== undefined) {
      link.remark = remark
    }
    if (customDomain !== undefined) {
      link.customDomain = customDomain || null
      link.domain = customDomain || req.get("host").replace(/^www\./, "")
    }

    // 重新构建shortUrl
    const currentDomain =
      link.customDomain || req.get("host").replace(/^www\./, "")
    const isDev = process.env.NODE_ENV === "development"
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(currentDomain)

    let baseUrl
    if (link.customDomain) {
      // 如果有自定义域名，使用 https
      baseUrl = `https://${link.customDomain}`
    } else if (isDev) {
      // 开发环境且没有自定义域名时，使用 /api 路径
      baseUrl = `http://${currentDomain}/api`
    } else if (isIpAddress) {
      // 如果是IP地址访问，使用 http
      baseUrl = `http://${currentDomain}`
    } else {
      // 如果是域名访问，使用 https
      baseUrl = `https://${currentDomain}`
    }
    link.shortUrl = `${baseUrl}/r/${link.shortKey}`

    await link.save()

    // 清除Redis缓存，确保获取最新的链接信息
    try {
      await delAsync(`shortlink:${link.shortKey}`)
      console.log(`已清除短链接缓存: ${link.shortKey}`)
    } catch (error) {
      console.error("清除Redis缓存失败:", error)
    }

    // 当目标集合发生变化（URL/短key/域名任一变化），清除均分计数键
    try {
      const longUrlsChanged =
        (urlsArray &&
          urlsArray.length > 0 &&
          JSON.stringify(urlsArray) !== JSON.stringify(oldLongUrls)) ||
        false
      const shortKeyChanged = !!(
        customShortKey && customShortKey !== oldCustomShortKey
      )
      const domainChanged = !!(
        customDomain !== undefined &&
        (customDomain || null) !== (oldCustomDomain || null)
      )

      if (longUrlsChanged || shortKeyChanged || domainChanged) {
        const newDomainValue = link.domain
        const newShortKeyValue = link.shortKey

        // 旧计数键
        await delAsync(`balance:${oldDomainValue}:${oldCustomShortKey}`)
        await delAsync(`balance:${oldDomainValue}:${oldCustomShortKey}:seq`)
        // 新计数键（若存在历史残留，确保清空）
        await delAsync(`balance:${newDomainValue}:${newShortKeyValue}`)
        await delAsync(`balance:${newDomainValue}:${newShortKeyValue}:seq`)
      }
    } catch (error) {
      console.error("清除均分计数键失败:", error)
    }

    // 添加详细的审计日志
    await createAuditLog({
      userId: req.user.id,
      action: ACTION_TYPES.UPDATE_LINK,
      resourceType: RESOURCE_TYPES.LINK,
      resourceId: link._id,
      description: `更新短链接: ${link.shortUrl}`,
      metadata: {
        longUrls: urlsArray,
        oldLongUrls,
        remark,
        oldRemark,
        customShortKey,
        oldCustomShortKey,
        customDomain,
        oldCustomDomain,
      },
      req,
    })

    res.json({
      success: true,
      data: link,
      message: "短链接更新成功",
    })
  } catch (error) {
    console.error("更新短链接错误:", error)
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    })
  }
}

// 获取特定短链接的点击记录
const getLinkClickRecords = async (req, res) => {
  try {
    const { id } = req.params
    const {
      current = 1,
      pageSize = 10,
      startDate,
      endDate,
      showBots = false,
    } = req.query

    // 验证短链接是否存在，并确保用户有权限访问
    const link = await Link.findById(id)

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "短链接不存在",
      })
    }

    // 检查用户是否有权限 - 简化逻辑并确保admin用户有权限
    // 如果用户是admin，直接允许访问，不需要其他检查
    if (req.user.username === "admin" || req.user.isAdmin) {
      console.log("管理员用户，允许访问点击记录")
      // 管理员用户，直接允许访问
    } else {
      // 非管理员用户，检查是否是创建者或有查看所有权限
      const isOwner = link.createdBy.toString() === req.user.id
      const hasViewAllPermission =
        req.user.permissions?.includes(PERMISSION_CODES.LINK_VIEW_ALL) ||
        req.user.roles?.some((role) =>
          role.permissions?.some(
            (perm) => perm.code === PERMISSION_CODES.LINK_VIEW_ALL
          )
        )

      // 如果既不是链接创建者，也没有查看所有权限，则拒绝访问
      if (!isOwner && !hasViewAllPermission) {
        return res.status(403).json({
          success: false,
          message: "没有权限查看该短链接的点击记录",
        })
      }
    }

    // 构建查询条件
    const query = {
      action: ACTION_TYPES.CLICK_LINK,
      resourceType: RESOURCE_TYPES.LINK,
      resourceId: id,
    }

    // 添加爬虫过滤
    if (showBots !== "true") {
      query["metadata.isBot"] = { $ne: true }
    }

    // 添加日期范围过滤
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

    // 分页设置
    const skip = (parseInt(current) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    // 使用Promise.all并行执行查询以提高性能
    const [clickRecords, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 }) // 按创建时间降序排序
        .skip(skip)
        .limit(limit)
        .lean(), // 使用lean()优化性能
      AuditLog.countDocuments(query),
    ])

    // 转换记录为前端所需格式并优化信息展示
    const formattedRecords = clickRecords.map((record) => ({
      time: record.createdAt,
      ipAddress: formatIpAddress(record.ipAddress),
      userAgent: parseUserAgent(record.userAgent),
      referrer: record.metadata?.referer || "direct",
      // 处理引用来源，使其更易读
      referrerDisplay: formatReferer(record.metadata?.referer),
      isBot: record.metadata?.isBot || false,
      // 新增：访问的目标URL
      targetUrl: record.metadata?.selectedUrl || null,
    }))

    res.json({
      success: true,
      data: formattedRecords,
      total,
      current: parseInt(current),
      pageSize: parseInt(pageSize),
    })
  } catch (error) {
    console.error("获取点击记录错误:", error)
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    })
  }
}

// 获取短链接的历史记录（创建和修改记录）
const getLinkHistory = async (req, res) => {
  try {
    const { id } = req.params

    // 1. 验证短链接是否存在
    const link = await Link.findById(id).populate(
      "createdBy",
      "username nickname email"
    )

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "短链接不存在",
      })
    }

    // 2. 检查用户权限 - 简化逻辑并确保admin用户有权限
    // 如果用户是admin，直接允许访问，不需要其他检查
    if (req.user.username === "admin" || req.user.isAdmin) {
      console.log("管理员用户，允许访问")
      // 管理员用户，直接允许访问
    } else {
      // 非管理员用户，检查是否是创建者或有查看所有权限
      const isOwner = link.createdBy._id.toString() === req.user.id
      const hasViewAllPermission =
        req.user.permissions?.includes(PERMISSION_CODES.LINK_VIEW_ALL) ||
        req.user.roles?.some((role) =>
          role.permissions?.some(
            (perm) => perm.code === PERMISSION_CODES.LINK_VIEW_ALL
          )
        )

      console.log("是否创建者:", isOwner)
      console.log("是否有查看所有权限:", hasViewAllPermission)

      // 如果既不是链接创建者，也没有查看所有权限，则拒绝访问
      if (!isOwner && !hasViewAllPermission) {
        return res.status(403).json({
          success: false,
          message: "没有权限查看该短链接的历史记录",
        })
      }
    }

    // 3. 查询该短链接的所有审计日志
    const auditLogs = await AuditLog.find({
      resourceType: RESOURCE_TYPES.LINK,
      resourceId: id,
      action: { $in: [ACTION_TYPES.CREATE_LINK, ACTION_TYPES.UPDATE_LINK] },
    })
      .populate("userId", "username nickname email")
      .sort({ createdAt: -1 }) // 按时间从新到旧排序
      .lean()

    // 4. 转换数据为前端所需格式
    const historyRecords = auditLogs.map((log) => {
      // 从metadata中提取变更信息
      const changes = {}
      if (log.action === ACTION_TYPES.UPDATE_LINK && log.metadata) {
        // 如果是更新操作，记录变更的字段
        if (
          JSON.stringify(log.metadata.oldLongUrls) !==
          JSON.stringify(log.metadata.longUrls)
        ) {
          changes.longUrls = {
            from: log.metadata.oldLongUrls,
            to: log.metadata.longUrls,
          }
        }

        if (log.metadata.oldRemark !== log.metadata.remark) {
          changes.remark = {
            from: log.metadata.oldRemark || "",
            to: log.metadata.remark || "",
          }
        }

        if (log.metadata.oldCustomShortKey !== log.metadata.customShortKey) {
          changes.customShortKey = {
            from: log.metadata.oldCustomShortKey,
            to: log.metadata.customShortKey,
          }
        }

        if (log.metadata.oldCustomDomain !== log.metadata.customDomain) {
          changes.customDomain = {
            from: log.metadata.oldCustomDomain || null,
            to: log.metadata.customDomain || null,
          }
        }
      }

      return {
        id: log._id,
        action: log.action === ACTION_TYPES.CREATE_LINK ? "创建" : "更新",
        userId: log.userId._id,
        username: log.userId.nickname || log.userId.username,
        email: log.userId.email,
        time: log.createdAt,
        description: log.description,
        changes: log.action === ACTION_TYPES.UPDATE_LINK ? changes : null,
        ipAddress: formatIpAddress(log.ipAddress),
        userAgent: parseUserAgent(log.userAgent),
      }
    })

    // 5. 构建完整的响应数据
    const responseData = {
      linkInfo: {
        id: link._id,
        shortUrl: link.shortUrl,
        longUrls: link.longUrls,
        shortKey: link.shortKey,
        customDomain: link.customDomain,
        remark: link.remark,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        creator: {
          id: link.createdBy._id,
          username: link.createdBy.nickname || link.createdBy.username,
          email: link.createdBy.email,
        },
      },
      history: historyRecords,
    }

    res.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error("获取短链接历史记录错误:", error)
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    })
  }
}

// 获取链接的URL统计信息
const getLinkUrlStats = async (req, res) => {
  try {
    const { id } = req.params

    // 验证短链接是否存在
    const link = await Link.findById(id)

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "短链接不存在",
      })
    }

    // 检查用户权限
    if (req.user.username === "admin" || req.user.isAdmin) {
      // 管理员用户，直接允许访问
    } else {
      // 非管理员用户，检查是否是创建者或有查看所有权限
      const isOwner = link.createdBy.toString() === req.user.id
      const hasViewAllPermission =
        req.user.permissions?.includes(PERMISSION_CODES.LINK_VIEW_ALL) ||
        req.user.roles?.some((role) =>
          role.permissions?.some(
            (perm) => perm.code === PERMISSION_CODES.LINK_VIEW_ALL
          )
        )

      if (!isOwner && !hasViewAllPermission) {
        return res.status(403).json({
          success: false,
          message: "没有权限查看该短链接的统计信息",
        })
      }
    }

    // 获取每个URL的详细统计
    const urlStats = {}
    if (link.longUrls && link.longUrls.length > 0) {
      for (const url of link.longUrls) {
        const clickCount = await AuditLog.countDocuments({
          action: ACTION_TYPES.CLICK_LINK,
          resourceId: link._id,
          "metadata.selectedUrl": url,
          "metadata.isBot": { $ne: true },
        })

        // 获取最近访问记录
        const recentClicks = await AuditLog.find({
          action: ACTION_TYPES.CLICK_LINK,
          resourceId: link._id,
          "metadata.selectedUrl": url,
          "metadata.isBot": { $ne: true },
        })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()

        urlStats[url] = {
          clickCount,
          recentClicks: recentClicks.map((click) => ({
            time: click.createdAt,
            ipAddress: click.ipAddress,
            userAgent: click.userAgent,
          })),
        }
      }
    }

    res.json({
      success: true,
      data: {
        linkId: link._id,
        shortUrl: link.shortUrl,
        longUrls: link.longUrls,
        urlStats,
      },
    })
  } catch (error) {
    console.error("获取URL统计错误:", error)
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    })
  }
}

// 获取短链接的URL分布统计
const getLinkDistributionStats = async (req, res) => {
  try {
    const { id } = req.params

    // 验证短链接是否存在
    const link = await Link.findById(id)

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "短链接不存在",
      })
    }

    // 检查用户权限
    if (req.user.username === "admin" || req.user.isAdmin) {
      // 管理员用户，直接允许访问
    } else {
      // 非管理员用户，检查是否是创建者或有查看所有权限
      const isOwner = link.createdBy.toString() === req.user.id
      const hasViewAllPermission =
        req.user.permissions &&
        req.user.permissions.some(
          (permission) => permission.code === PERMISSION_CODES.LINK_VIEW_ALL
        )

      if (!isOwner && !hasViewAllPermission) {
        return res.status(403).json({
          success: false,
          message: "没有权限查看此短链接的分布统计",
        })
      }
    }

    // 获取分布统计
    const distributionStats = await getUrlDistributionStats(
      link.domain,
      link.shortKey,
      link.longUrls
    )

    if (!distributionStats) {
      return res.status(500).json({
        success: false,
        message: "获取分布统计失败",
      })
    }

    res.json({
      success: true,
      data: distributionStats,
    })
  } catch (error) {
    console.error("获取URL分布统计错误:", error)
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    })
  }
}

// 判断某个短链是否存在中国大陆点击
const getLinkCNStats = async (req, res) => {
  try {
    const { id } = req.params
    const { startDate, endDate, excludeBots = "true" } = req.query

    // 验证短链接是否存在
    const link = await Link.findById(id)
    if (!link) {
      return res.status(404).json({ success: false, message: "短链接不存在" })
    }

    // 权限校验（允许管理员或创建者，或拥有查看所有权限的用户）
    if (!(req.user?.username === "admin" || req.user?.isAdmin)) {
      const isOwner = link.createdBy.toString() === req.user.id
      const hasViewAllPermission =
        req.user.permissions?.includes(PERMISSION_CODES.LINK_VIEW_ALL) ||
        req.user.roles?.some((role) =>
          role.permissions?.some(
            (perm) => perm.code === PERMISSION_CODES.LINK_VIEW_ALL
          )
        )
      if (!isOwner && !hasViewAllPermission) {
        return res
          .status(403)
          .json({ success: false, message: "没有权限查看该短链接的统计信息" })
      }
    }

    // 构建审计日志匹配条件
    const match = {
      action: ACTION_TYPES.CLICK_LINK,
      resourceId: link._id,
      "metadata.isBot":
        excludeBots === "true" ? { $ne: true } : { $in: [true, false, null] },
      "metadata.isMainlandChina": true,
    }
    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }

    const count = await AuditLog.countDocuments(match)
    const hasMainland = count > 0

    return res.json({
      success: true,
      data: {
        linkId: link._id,
        shortUrl: link.shortUrl,
        hasMainland,
        mainlandClickCount: count,
      },
    })
  } catch (error) {
    console.error("获取短链中国大陆点击统计失败:", error)
    return res.status(500).json({ success: false, message: "服务器错误" })
  }
}

module.exports = {
  createShortLink,
  getLinks,
  getAllLinks,
  redirectToLongLink,
  deleteLink,
  updateLink,
  getLinkClickRecords,
  getLinkHistory,
  getLinkUrlStats,
  getLinkDistributionStats,
  getLinkCNStats,
  getAllLinksMainlandPresence,
}
