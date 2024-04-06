import { apiRequest } from '@/services/index';

// 获取域名列表
export const fetchDomains = async () => {
  try {
    const response = await apiRequest.get('/domains/all');
    return response.data;
  } catch (error) {
    console.error('获取域名列表失败:', error);
    throw error;
  }
};

// 添加域名
export const addDomain = async (domain: string) => {
  try {
    const response = await apiRequest.post('/domains', { domain });
    return response.data;
  } catch (error) {
    console.error('添加域名失败:', error);
    throw error;
  }
};

// 验证域名
export const verifyDomain = async (domain: string) => {
  try {
    const response = await apiRequest.post(`/domains/${domain}/verify`);
    return response.data;
  } catch (error) {
    console.error('验证域名失败:', error);
    throw error;
  }
};

// 删除域名
export async function deleteDomain(domain: string) {
  try {
    const response = await apiRequest.delete(`/domains/${domain}`);

    // 直接返回后端的响应数据，因为后端返回的格式是 { success: true, message: string, data: any }
    return response.data;
  } catch (error) {
    console.error('删除域名失败:', error);
    throw error;
  }
}

// 重新验证域名
export const recheckDomain = async (domain: string) => {
  try {
    const response = await apiRequest.post(`/domains/${domain}/recheck`);
    return response.data;
  } catch (error) {
    console.error('域名重新验证失败:', error);
    throw error;
  }
};

/** 获取所有用户的域名列表 */
export async function fetchAllDomains(params?: {
  current?: number;
  pageSize?: number;
  domain?: string;
  'user.username'?: string;
}) {
  try {
    const response = await apiRequest.get('/domains/all', params);
    return response.data;
  } catch (error) {
    console.error('获取所有域名列表失败:', error);
    throw error;
  }
}

// 更新 SSL 证书
export const renewSSLCertificate = async (domain: string) => {
  try {
    const response = await apiRequest.post(`/domains/${domain}/ssl/renew`);
    return response.data;
  } catch (error) {
    console.error('更新 SSL 证书失败:', error);
    throw error;
  }
};

// 导出类型定义
export interface DomainResponse {
  success: boolean;
  data?: any;
  message?: string;
  total?: number;
}

export interface DomainItem {
  _id: string;
  domain: string;
  verified: boolean;
  verificationCode: string;
  createdAt: string;
}
