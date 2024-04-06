// 短链项类型
export type LinkItem = {
  _id: string;
  longUrls: string[];
  shortKey: string;
  shortUrl: string;
  customDomain: string | null;
  createdAt: string;
  remark: string;
  clickCount: number;
  lastClickTime: string;
  urlStats: Record<string, number>; // 新增：每个URL的访问统计
  recentClicks: Array<{
    time: string;
    ipAddress: string;
    userAgent: string;
    targetUrl?: string; // 新增：访问的目标URL
  }>;
  createdBy?: {
    _id?: string;
    username: string;
    nickname: string;
    email: string;
  };
};

// 域名项类型
export type DomainItem = {
  _id: string;
  domain: string;
  verified: boolean;
  createdAt: string;
};

// 更新短链参数类型
export type UpdateLinkParams = {
  id: string;
  data: {
    longUrls: string[];
    customShortKey?: string;
    remark?: string;
    customDomain?: string | null;
  };
};

// 点击记录类型
export interface ClickRecord {
  time: string;
  ipAddress: string;
  userAgent: string;
  referrer: string;
  referrerDisplay: string;
  targetUrl?: string; // 新增：访问的目标URL
}

// 历史记录类型
export interface HistoryRecord {
  id: string;
  action: string;
  userId: string;
  username: string;
  email: string;
  time: string;
  description: string;
  changes: {
    longUrls?: { from: string[]; to: string[] };
    remark?: { from: string; to: string };
    customShortKey?: { from: string; to: string };
  } | null;
  ipAddress: string;
  userAgent: string;
}

// 短链接详情类型
export interface LinkDetail {
  linkInfo: {
    id: string;
    shortUrl: string;
    longUrls: string[];
    shortKey: string;
    customDomain: string | null;
    remark: string;
    createdAt: string;
    updatedAt: string;
    creator: {
      id: string;
      username: string;
      email: string;
    };
  };
  history: HistoryRecord[];
}

// 分页类型
export interface PaginationParams {
  current?: number;
  pageSize?: number;
}

// 点击记录过滤类型
export interface ClickRecordFilter {
  startDate?: string;
  endDate?: string;
}
