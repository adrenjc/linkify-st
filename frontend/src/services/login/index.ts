// @ts-ignore
/* eslint-disable */
import { apiRequest } from '@/services/index'; // 引入封装的请求方法
import type { API } from './typings.d';

/** 获取当前的用户 GET /api/currentUser */
export async function currentUser() {
  try {
    const response = await apiRequest.get(`/user`);
    return response.data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error; // 抛出错误以便调用者处理
  }
}

/** 退出登录接口 POST /api/login/outLogin */
export async function outLogin(options?: { [key: string]: any }) {
  localStorage.removeItem('x-auth-token'); // 清空 x-auth-token 的值
}

/** 登录接口 POST /api/login */
export async function login(body: API.LoginParams) {
  apiRequest;
  try {
    const response = await apiRequest.post(`/login`, body, {
      headers: { 'Content-Type': 'application/json' },
    });
    const token = response.data.token;
    if (token) {
      localStorage.setItem('x-auth-token', token);
    }

    return response.data;
  } catch (error) {
    console.error('登录失败:', error);
    throw error; // 抛出错误以便调用者处理
  }
}

/** 获取所有用户 GET /api/users */
export async function getAllUsers(params: {
  page?: number;
  pageSize?: number;
  username?: string;
  email?: string;
  status?: number;
  [key: string]: any;
}) {
  try {
    const response = await apiRequest.get('/users', params);
    return response.data;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
}

/** 更新用户信息 PUT /api/users/:id */
export async function updateUser(
  data: { username: string; password: string; roles: string[] },
  id: string,
) {
  try {
    const response = await apiRequest.put(`/users/${id}`, data);
    return response.data; // 返回更新后的用户数据
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error; // 抛出错误以便调用者处理
  }
}

/** 新增用户 POST /api/users */
export async function createUser(data: { username: string; password: string; roles: string[] }) {
  try {
    const response = await apiRequest.post(`/register`, data); // 发送新增用户请求
    return response.data; // 返回新增的用户数据
  } catch (error) {
    console.error('新增用户失败:', error);
    throw error; // 抛出错误以便调用者处理
  }
}

/** 注册接口 POST /api/register */
export async function register(data: { username: string; password: string }): Promise<{
  token?: string;
  message?: string;
}> {
  try {
    const response = await apiRequest.post('/register', data);
    // 如果后端返回了token，我们直接返回包含token的对象
    if (response.data.token) {
      return {
        token: response.data.token,
        message: response.data.message,
      };
    }
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '注册失败，请稍后重试';
    console.error('注册失败:', errorMessage);
    throw error;
  }
}

/** 删除用户 */
export async function deleteUser(id: string) {
  return apiRequest.delete(`/users/${id}`);
}
