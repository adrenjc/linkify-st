import { PERMISSION_CODES } from '@/constants/permissions';

// 定义CurrentUser类型
type CurrentUser = {
  id?: string;
  username?: string;
  isAdmin?: boolean;
  permissions?: any[];
  roles?: any[];
};

/**
 * @see https://umijs.org/docs/max/access#access
 *
 * 访问权限控制
 * - canAdmin: 是否是超级管理员
 * - hasPermission: 检查是否有特定权限
 * - hasAnyPermission: 检查是否有任意一个权限
 * - hasAllPermissions: 检查是否有所有权限
 */
export default function access(initialState: { currentUser?: CurrentUser } | undefined) {
  const { currentUser } = initialState ?? {};

  // 获取用户所有权限
  const getUserPermissions = () => {
    if (!currentUser) return new Set<string>();

    const permissions = new Set<string>();

    // 添加角色包含的权限
    currentUser.roles?.forEach((role: any) => {
      role.permissions?.forEach((permission: any) => {
        permissions.add(permission.code);
      });
    });

    // 添加直接分配给用户的权限
    currentUser?.permissions?.forEach((permission: any) => {
      permissions.add(permission.code);
    });

    return permissions;
  };

  const userPermissions = getUserPermissions();

  // 检查是否有审计日志权限

  return {
    // 是否是超级管理员
    canAdmin: currentUser && currentUser.username === 'admin',

    //检查是否有审计日志权限
    hasAuditLogPermission: () => {
      if (!currentUser) return false;
      if (currentUser.username === 'admin') return true;
      return userPermissions.has(PERMISSION_CODES.AUDIT_VIEW);
    },

    // 检查是否有用户管理权限
    hasUserManagementPermission: () => {
      if (!currentUser) return false;
      if (currentUser.username === 'admin') return true;
      return userPermissions.has(PERMISSION_CODES.USER_VIEW);
    },

    // 检查是否有域名管理权限
    hasDomainManagementPermission: () => {
      if (!currentUser) return false;
      if (currentUser.username === 'admin') return true;
      return userPermissions.has(PERMISSION_CODES.DOMAIN_MANAGE);
    },

    // 检查是否有角色管理权限
    hasRoleManagementPermission: () => {
      if (!currentUser) return false;
      if (currentUser.username === 'admin') return true;
      return userPermissions.has(PERMISSION_CODES.ROLE_VIEW);
    },

    // 检查是否可以查看所有用户的短链接
    canViewAllLinks: () => {
      if (!currentUser) return false;
      if (currentUser.username === 'admin') return true;
      return userPermissions.has(PERMISSION_CODES.LINK_VIEW_ALL);
    },

    // 检查是否可以管理所有用户的短链接
    canManageAllLinks: () => {
      if (!currentUser) return false;
      if (currentUser.username === 'admin') return true;
      return userPermissions.has(PERMISSION_CODES.LINK_MANAGE);
    },

    canViewAllDomains: currentUser?.permissions?.includes('domain:view'),
  };
}
