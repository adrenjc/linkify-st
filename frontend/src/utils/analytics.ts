/**
 * Google Analytics 工具类
 * 用于管理 GA4 事件追踪和页面浏览
 */

import { GA_MEASUREMENT_ID } from '../../config/analytics';

// 声明 gtag 全局函数
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

/**
 * 初始化 Google Analytics
 */
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

/**
 * 追踪页面浏览
 * @param url 页面URL
 * @param title 页面标题
 */
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title || document.title,
    });
  }
};

/**
 * 追踪自定义事件
 * @param action 事件动作
 * @param category 事件分类
 * @param label 事件标签
 * @param value 事件值
 */
export const trackEvent = (
  action: string,
  category: string = 'general',
  label?: string,
  value?: number,
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * 追踪短链相关事件
 */
export const ShortLinkAnalytics = {
  // 短链创建
  trackShortLinkCreate: (linkCount: number = 1) => {
    trackEvent('create_short_link', 'shortlink', 'create', linkCount);
  },

  // 短链点击
  trackShortLinkClick: (shortKey: string, targetUrl?: string) => {
    trackEvent('click_short_link', 'shortlink', shortKey);
    if (targetUrl) {
      trackEvent('redirect_to_target', 'shortlink', targetUrl);
    }
  },

  // 短链编辑
  trackShortLinkEdit: (shortKey: string) => {
    trackEvent('edit_short_link', 'shortlink', shortKey);
  },

  // 短链删除
  trackShortLinkDelete: (shortKey: string) => {
    trackEvent('delete_short_link', 'shortlink', shortKey);
  },

  // 查看访问记录
  trackViewClickRecords: (shortKey: string) => {
    trackEvent('view_click_records', 'shortlink', shortKey);
  },

  // 查看短链详情
  trackViewLinkDetail: (shortKey: string) => {
    trackEvent('view_link_detail', 'shortlink', shortKey);
  },
};

/**
 * 追踪用户行为事件
 */
export const UserAnalytics = {
  // 用户登录
  trackLogin: (method: string = 'unknown') => {
    trackEvent('login', 'user', method);
  },

  // 用户登出
  trackLogout: () => {
    trackEvent('logout', 'user');
  },

  // 页面停留时间
  trackTimeOnPage: (page: string, seconds: number) => {
    trackEvent('time_on_page', 'engagement', page, seconds);
  },

  // 搜索行为
  trackSearch: (query: string, results: number) => {
    trackEvent('search', 'user', query, results);
  },
};

/**
 * 追踪系统事件
 */
export const SystemAnalytics = {
  // API 错误
  trackAPIError: (endpoint: string, statusCode: number) => {
    trackEvent('api_error', 'system', endpoint, statusCode);
  },

  // 功能使用
  trackFeatureUsage: (feature: string) => {
    trackEvent('feature_usage', 'system', feature);
  },

  // 性能指标
  trackPerformance: (metric: string, value: number) => {
    trackEvent('performance', 'system', metric, value);
  },
};

/**
 * 设置用户属性
 * @param userId 用户ID
 * @param properties 用户属性
 */
export const setUserProperties = (userId?: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    if (userId) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: userId,
      });
    }

    if (properties) {
      window.gtag('set', properties);
    }
  }
};

/**
 * 检查 GA 是否已加载
 */
export const isGALoaded = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    Array.isArray(window.dataLayer)
  );
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  ShortLinkAnalytics,
  UserAnalytics,
  SystemAnalytics,
  setUserProperties,
  isGALoaded,
};
