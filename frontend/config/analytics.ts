/**
 * Google Analytics 配置
 */

// 从环境变量获取 GA 测量 ID
export const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || 'G-7XDK7PJHFP';

// GA 配置选项
export const GA_CONFIG = {
  // 测量ID
  measurementId: GA_MEASUREMENT_ID,

  // 是否在开发环境启用
  enableInDev: process.env.NODE_ENV === 'development',

  // 是否启用调试模式
  debug: process.env.NODE_ENV === 'development',

  // 自动追踪的事件
  autoTrack: {
    pageView: true,
    outbound: true,
    fileDownload: true,
    scroll: true,
  },

  // Cookie 设置
  cookieSettings: {
    // Cookie 过期时间（秒）
    cookieExpires: 63072000, // 2年

    // 是否使用安全 Cookie
    cookieSecure: true,

    // 是否启用跨域追踪
    allowLinker: false,
  },

  // 隐私设置
  privacy: {
    // 是否匿名化 IP
    anonymizeIp: true,

    // 是否尊重 Do Not Track
    respectDnt: true,

    // 是否需要用户同意
    requireConsent: false,
  },
};

export default GA_CONFIG;
