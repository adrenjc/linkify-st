/**
 * 系统权限代码常量
 */
export const PERMISSION_CODES = {
  // 用户管理
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // 角色管理
  ROLE_VIEW: 'role:view',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',

  // 域名管理
  DOMAIN_VIEW: 'domain:view',
  DOMAIN_CREATE: 'domain:create',
  DOMAIN_UPDATE: 'domain:update',
  DOMAIN_DELETE: 'domain:delete',
  DOMAIN_VERIFY: 'domain:verify',
  DOMAIN_MANAGE: 'domain:manage',

  // 短链接管理
  LINK_VIEW: 'link:view',
  LINK_CREATE: 'link:create',
  LINK_UPDATE: 'link:update',
  LINK_DELETE: 'link:delete',
  LINK_MANAGE: 'link:manage',
  LINK_VIEW_ALL: 'link:view:all',

  // 审计日志
  AUDIT_VIEW: 'audit:view',
} as const;

/**
 * 权限分组
 * 用于权限管理界面的展示
 */
export const PERMISSION_GROUPS = [
  {
    label: '用户管理',
    permissions: [
      PERMISSION_CODES.USER_VIEW,
      PERMISSION_CODES.USER_CREATE,
      PERMISSION_CODES.USER_UPDATE,
      PERMISSION_CODES.USER_DELETE,
    ],
  },
  {
    label: '角色管理',
    permissions: [
      PERMISSION_CODES.ROLE_VIEW,
      PERMISSION_CODES.ROLE_CREATE,
      PERMISSION_CODES.ROLE_UPDATE,
      PERMISSION_CODES.ROLE_DELETE,
    ],
  },
  {
    label: '业务功能',
    permissions: [
      PERMISSION_CODES.LINK_MANAGE,
      PERMISSION_CODES.DOMAIN_MANAGE,
      PERMISSION_CODES.LINK_VIEW_ALL,
    ],
  },
  {
    label: '系统管理',
    permissions: [PERMISSION_CODES.AUDIT_VIEW],
  },
] as const;

// 导出所有权限列表
export const ALL_PERMISSIONS = Object.values(PERMISSION_CODES);

// 导出权限类型
export type PermissionCode = keyof typeof PERMISSION_CODES;
