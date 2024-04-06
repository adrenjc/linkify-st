// src/services/shortUrl/shorturl.ts
import { apiRequest } from '@/services/index'; // 引入封装的请求方法

// 创建短链接
export const createShortLink = async (data: {
  longUrls?: string[];
  longUrl?: string; // 向后兼容
  customDomain?: string;
  customShortKey?: string;
  remark?: string;
}): Promise<any> => {
  try {
    const response = await apiRequest.post('/links', data); // 直接传递整个 data 对象
    return response.data;
  } catch (error) {
    console.error('创建短链接错误:', error);
    throw error; // 抛出错误以便调用者处理
  }
};

// 获取用户所有短链接
export const fetchLinks = async (params?: { [key: string]: any }): Promise<any> => {
  try {
    const response = await apiRequest.get(`/links`, params);
    return response.data;
  } catch (error) {
    console.error('获取短链接错误:', error);
    throw error; // 抛出错误以便调用者处理
  }
};

// 获取所有用户的短链接（需要特殊权限）
export const fetchAllLinks = async (params?: { [key: string]: any }): Promise<any> => {
  try {
    const response = await apiRequest.get(`/links/all`, params);
    return response.data;
  } catch (error) {
    console.error('获取所有短链接错误:', error);
    throw error; // 抛出错误以便调用者处理
  }
};

// 获取短链接点击记录（完整记录，支持分页和日期筛选）
export const fetchClickRecords = async (
  linkId: string,
  params?: {
    current?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  },
): Promise<any> => {
  try {
    // 假设后端提供了获取点击记录的API
    // 如果没有，您需要与后端开发人员沟通添加此API
    const response = await apiRequest.get(`/links/${linkId}/clicks`, params);
    return response.data;
  } catch (error) {
    console.error('获取点击记录错误:', error);
    throw error;
  }
};

// 删除短链接
export const deleteLink = async (id: string): Promise<void> => {
  try {
    await apiRequest.delete(`/links/${id}`);
  } catch (error) {
    console.error('删除短链接错误:', error);
    throw error; // 抛出错误以便调用者处理
  }
};

// 更新短链接
export async function updateLink(
  id: string,
  data: {
    longUrls?: string[];
    longUrl?: string; // 向后兼容
    customShortKey?: string;
    customDomain?: string;
    remark?: string;
  },
) {
  return apiRequest.put(`/links/${id}`, data);
}

// 获取短链接的历史记录
export const fetchLinkHistory = async (linkId: string): Promise<any> => {
  try {
    const response = await apiRequest.get(`/links/${linkId}/history`);
    return response.data;
  } catch (error) {
    console.error('获取短链接历史记录错误:', error);
    throw error;
  }
};

// 获取短链接的URL统计信息
export const fetchLinkUrlStats = async (linkId: string): Promise<any> => {
  try {
    const response = await apiRequest.get(`/links/${linkId}/url-stats`);
    return response.data;
  } catch (error) {
    console.error('获取短链接URL统计错误:', error);
    throw error;
  }
};

// 示例：设置请求头
// setRequestHeader('Authorization', 'Bearer your_token'); // 根据需要设置请求头
