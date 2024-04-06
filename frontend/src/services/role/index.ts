import { apiRequest } from '@/services';

// 获取角色列表
export async function getRoles(params: any = {}) {
  const response = await apiRequest.get('/roles', params);
  return response.data;
}

// 创建角色
export async function createRole(data: {
  name: string;
  description?: string;
  permissions: string[];
}) {
  const response = await apiRequest.post('/roles', data);
  return response.data;
}

// 更新角色
export async function updateRole(
  id: string,
  data: {
    name?: string;
    description?: string;
    permissions?: string[];
  },
) {
  const response = await apiRequest.put(`/roles/${id}`, data);
  return response.data;
}

// 删除角色
export async function deleteRole(id: string) {
  const response = await apiRequest.delete(`/roles/${id}`);
  return response.data;
}
// 获取所有权限列表
export async function getPermissions() {
  const response = await apiRequest.get('/permissions');
  return response.data;
}
