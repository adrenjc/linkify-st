import { useModel } from 'umi';

export const usePermission = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser: globalCurrentUser } = initialState || {};

  const hasPermission = (permission: string) => {
    if (!globalCurrentUser?.roles) return false;

    const userPermissions = new Set();

    // 收集角色权限
    globalCurrentUser.roles.forEach((role: any) => {
      role.permissions?.forEach((permission: any) => {
        userPermissions.add(permission.code);
      });
    });

    // 收集直接分配的权限
    globalCurrentUser.permissions?.forEach((permission: any) => {
      userPermissions.add(permission.code);
    });

    // admin 用户拥有所有权限
    return userPermissions.has(permission) || globalCurrentUser.username === 'admin';
  };

  return { hasPermission };
};
