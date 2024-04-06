import {
  ShortLinkAnalytics,
  SystemAnalytics,
  UserAnalytics,
  isGALoaded,
  setUserProperties,
  trackEvent,
  trackPageView,
} from '@/utils/analytics';
import { useAccess, useLocation } from '@umijs/max';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Google Analytics Hook
 * 提供页面追踪和事件追踪功能
 */
export const useAnalytics = () => {
  const location = useLocation();
  const access = useAccess();
  const lastPathRef = useRef<string>('');
  const pageStartTimeRef = useRef<number>(Date.now());

  // 页面浏览追踪
  useEffect(() => {
    const currentPath = location.pathname + location.search;

    // 避免重复追踪相同页面
    if (currentPath !== lastPathRef.current && isGALoaded()) {
      // 追踪上一页的停留时间
      if (lastPathRef.current) {
        const timeOnPage = Math.round((Date.now() - pageStartTimeRef.current) / 1000);
        UserAnalytics.trackTimeOnPage(lastPathRef.current, timeOnPage);
      }

      // 追踪新页面
      trackPageView(currentPath, document.title);
      lastPathRef.current = currentPath;
      pageStartTimeRef.current = Date.now();
    }
  }, [location]);

  // 设置用户信息
  const setUser = useCallback(
    (userId: string, userInfo?: Record<string, any>) => {
      const properties = {
        user_role: access?.canAdmin ? 'admin' : 'user',
        ...userInfo,
      };
      setUserProperties(userId, properties);
    },
    [access],
  );

  // 追踪事件的便捷方法
  const track = useCallback(
    {
      // 通用事件追踪
      event: trackEvent,

      // 短链相关事件
      shortLink: {
        create: ShortLinkAnalytics.trackShortLinkCreate,
        click: ShortLinkAnalytics.trackShortLinkClick,
        edit: ShortLinkAnalytics.trackShortLinkEdit,
        delete: ShortLinkAnalytics.trackShortLinkDelete,
        viewRecords: ShortLinkAnalytics.trackViewClickRecords,
        viewDetail: ShortLinkAnalytics.trackViewLinkDetail,
      },

      // 用户行为事件
      user: {
        login: UserAnalytics.trackLogin,
        logout: UserAnalytics.trackLogout,
        search: UserAnalytics.trackSearch,
      },

      // 系统事件
      system: {
        apiError: SystemAnalytics.trackAPIError,
        featureUsage: SystemAnalytics.trackFeatureUsage,
        performance: SystemAnalytics.trackPerformance,
      },
    },
    [],
  );

  return {
    track,
    setUser,
    isLoaded: isGALoaded(),
  };
};

/**
 * 用于监听 API 请求错误的 Hook
 */
export const useAnalyticsErrorTracking = () => {
  const { track } = useAnalytics();

  const trackAPIError = useCallback(
    (error: any, endpoint?: string) => {
      if (error?.response?.status && endpoint) {
        track.system.apiError(endpoint, error.response.status);
      }
    },
    [track],
  );

  return { trackAPIError };
};

/**
 * 性能监控 Hook
 */
export const usePerformanceTracking = () => {
  const { track } = useAnalytics();

  // 追踪页面加载时间
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime =
        window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      if (loadTime > 0) {
        track.system.performance('page_load_time', Math.round(loadTime));
      }
    }
  }, [track]);

  const trackCustomPerformance = useCallback(
    (metric: string, value: number) => {
      track.system.performance(metric, value);
    },
    [track],
  );

  return { trackCustomPerformance };
};

export default useAnalytics;
