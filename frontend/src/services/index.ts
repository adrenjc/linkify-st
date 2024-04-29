import { message } from 'antd';
import axios from 'axios';

// API 地址配置
// 开发环境：直接请求本地后端 localhost:5000
// 生产环境：使用相对路径 /api，需要用户在 Nginx 中配置代理
const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000/api' 
  : '/api';

// 初始化 axios 实例
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// 添加请求拦截器
apiClient.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('x-auth-token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }

    if (config.method === 'get' && config.params) {
      config.params = { ...config.params };
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// 添加响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || '请求失败';

    switch (error.response?.status) {
      case 401:
        localStorage.removeItem('x-auth-token');
        message.error(errorMessage);
        break;
      case 403:
        message.error(errorMessage || '没有权限');
        break;
      case 404:
        message.error(errorMessage || '资源不存在');
        break;
      case 500:
        message.error(errorMessage || '服务器错误');
        break;
      default:
        message.error(errorMessage);
    }

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  },
);

export { API_URL };

export const setRequestHeader = (key: string, value: string) => {
  apiClient.defaults.headers.common[key] = value;
};

export const apiRequest = {
  get: (endpoint: string, params = {}, headers = {}) => {
    return apiClient.get(endpoint, {
      params,
      headers: { ...apiClient.defaults.headers.common, ...headers },
    });
  },

  post: (endpoint: string, data = {}, headers = {}) => {
    return apiClient.post(endpoint, data, {
      headers: { ...apiClient.defaults.headers.common, ...headers },
    });
  },

  put: (endpoint: string, data = {}, headers = {}) => {
    return apiClient.put(endpoint, data, {
      headers: { ...apiClient.defaults.headers.common, ...headers },
    });
  },

  delete: (endpoint: string, headers = {}) => {
    return apiClient.delete(endpoint, {
      headers: { ...apiClient.defaults.headers.common, ...headers },
    });
  },
};
