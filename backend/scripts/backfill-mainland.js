const mongoose = require("mongoose")
const dotenv = require("dotenv")
const geoip = require("geoip-lite")

dotenv.config({
  path:
    process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env.development",
})

const AuditLog = require("../src/models/AuditLog")
const connectDB = require("../src/config/db")

async function run() {
  try {
    await connectDB()
    console.log("Mongo connected")

    const cursor = AuditLog.find({ action: "CLICK_LINK" }).cursor()
    let processed = 0
    let updated = 0

    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      processed += 1
      const ip = doc.ipAddress
      const meta = doc.metadata || {}

      // 如果已有字段则跳过（可通过环境变量强制覆盖）
      if (
        meta &&
        meta.country &&
        meta.isMainlandChina !== undefined &&
        !process.env.FORCE_BACKFILL
      ) {
        continue
      }

      let country = meta.country
      let region = meta.region
      let city = meta.city

      if (ip && ip !== "unknown") {
        const geo = geoip.lookup(ip)
        country = geo?.country || country || "UNKNOWN"
        region = geo?.region || region || null
        city = geo?.city || city || null
      }

      const isMainlandChina = country === "CN"

      doc.metadata = {
        ...meta,
        country,
        region,
        city,
        isMainlandChina,
      }

      await doc.save()
      updated += 1

      if (processed % 500 === 0) {
        console.log(`Processed ${processed}, updated ${updated}`)
      }
    }

    console.log(`Done. Processed ${processed}, updated ${updated}`)
    await mongoose.connection.close()
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

run()
