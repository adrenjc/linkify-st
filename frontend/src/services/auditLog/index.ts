import { apiRequest } from '@/services';

// 审计日志列表查询参数接口
export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}

// 审计日志数据接口
export type AuditLog = {
  _id: string;
  userId: {
    _id: string;
    username: string;
    nickname: string;
  };
  action: string;
  resourceType: string;
  resourceId: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  metadata: Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
};

// 获取审计日志列表
export async function getAuditLogs(params: AuditLogParams) {
  try {
    const response = await apiRequest.get('/audit-logs', params);
    return {
      data: response.data.data,
      total: response.data.total,
      success: response.data.success,
    };
  } catch (error) {
    console.error('获取审计日志列表失败:', error);
    return {
      data: [],
      total: 0,
      success: false,
    };
  }
}

// 获取审计日志统计信息
export async function getAuditLogStats(params: { startDate?: string; endDate?: string }) {
  try {
    const response = await apiRequest.get('/audit-logs/stats', params);
    return {
      data: response.data.data,
      success: response.data.success,
    };
  } catch (error) {
    console.error('获取审计日志统计失败:', error);
    return {
      data: [],
      success: false,
    };
  }
}
