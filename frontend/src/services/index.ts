import { message } from 'antd';
import axios from 'axios';

// 环境配置
const API_ENV = process.env.UMI_APP_ENV || 'dev'; // 默认开发环境

// 根据域名获取对应的API地址
// const getDomainApiUrl = (): string => {
//   const hostname = window.location.hostname.toLowerCase(); // 转换为小写，增加匹配容错性

//   // 域名映射配置
//   const domainConfigs = [
//     {
//       pattern: /^(?:www\.)?duckchat\.(icu|xyz|fun)$/,
//       getApiUrl: (domain: string) => `https://www.duckchat.${domain}/api`,
//     },
//     {
//       pattern: /^(?:www\.)?adrenjc\.top$/,
//       getApiUrl: () => 'https://www.adrenjc.top/api',
//     },
//   ];

//   // 尝试匹配域名
//   for (const config of domainConfigs) {
//     const match = hostname.match(config.pattern);
//     if (match) {
//       return config.getApiUrl(match[1]);
//     }
//   }

//   // 如果没有匹配到，返回默认API地址
//   return 'http://38.95.121.181/api';
// };

const ENV_CONFIG = {
  dev: {
    apiUrl: 'http://localhost:5000/api', // 开发环境
  },
  test: {
    apiUrl: 'https://www.onetop.vip/api', // 测试环境
  },
  pre: {
    apiUrl: 'https://www.onetop.vip/api', // 预发环境
  },
  prod: {
    apiUrl: 'https://www.onetop.vip/api', // 根据域名动态获取API地址
  },
};

// 获取当前环境配置
const currentEnv = ENV_CONFIG[API_ENV as keyof typeof ENV_CONFIG] || ENV_CONFIG.dev;

export const API_URL = currentEnv.apiUrl;

// 初始化 axios 实例
const apiClient = axios.create({
  baseURL: API_URL, // 使用动态配置的 API 地址
  timeout: 10000, // 建议适当延长超时时间
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
      // 确保参数正确传递，不被 JSON.stringify
      config.params = {
        ...config.params,
      };
    }

    return config;
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error);
  },
);

// 添加响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 获取错误信息
    const errorMessage = error.response?.data?.message || error.message || '请求失败，请稍后重试';

    // 根据状态码处理不同的错误情况
    switch (error.response?.status) {
      case 401:
        // 未授权，清除token并跳转到登录页
        localStorage.removeItem('x-auth-token');
        message.error(errorMessage);
        // 可以在这里添加跳转到登录页的逻辑
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
        // 如果有后端返回的错误信息，就直接显示
        if (error.response?.data?.message) {
          message.error(error.response.data.message);
        } else {
          message.error(errorMessage);
        }
    }

    // 返回一个带有错误信息的 rejected promise
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

// 示例调用
// apiRequest.get('/your-endpoint', { key: 'value' }, { 'Custom-Header': 'value' });
// apiRequest.post('/your-endpoint', { key: 'value' }, { 'Custom-Header': 'value' });
// apiRequest.put('/your-endpoint', { key: 'value' }, { 'Custom-Header': 'value' });
// apiRequest.delete('/your-endpoint', { 'Custom-Header': 'value' });
