import { message } from 'antd';
import axios from 'axios';

// API 地址配置
// 生产环境需要通过环境变量或手动配置指向后端地址
// 开发环境默认使用 localhost:5000
const getApiUrl = (): string => {
  // 1. 优先使用构建时注入的环境变量
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  
  // 2. 开发环境使用本地后端
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }
  
  // 3. 生产环境使用相对路径（需要用户配置 Nginx 代理）
  // 用户需要在 Nginx 中配置 /api 代理到后端服务
  return '/api';
};

export const API_URL = getApiUrl();

// 初始化 axios 实例
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// 添加请求拦截器
apiClient.interceptors.request.use(
  (config: any) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('x-auth-token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }

    // 处理 GET 请求的参数
    if (config.method === 'get' && config.params) {
      config.params = {
        ...config.params,
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 添加响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || '请求失败，请稍后重试';

    switch (error.response?.status) {
      case 401:
        localStorage.removeItem('x-auth-token');
        message.error(errorMessage);
        break;
      case 403:
        message.error(errorMessage || '没有权限访问该资源');
        break;
      case 404:
        message.error(errorMessage || '请求的资源不存在');
        break;
      case 500:
        message.error(errorMessage || '服务器错误，请稍后重试');
        break;
      default:
        if (error.response?.data?.message) {
          message.error(error.response.data.message);
        } else {
          message.error(errorMessage);
        }
    }

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  },
);

// 设置请求头的函数
export const setRequestHeader = (key: string, value: string) => {
  apiClient.defaults.headers.common[key] = value;
};

// 封装的网络请求方法
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
