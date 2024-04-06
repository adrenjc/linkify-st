/**
 * 审计日志操作类型映射
 */
export const ACTION_MAP = {
  // 短链接相关
  CREATE_LINK: { text: '创建短链接', color: 'blue' },
  UPDATE_LINK: { text: '更新短链接', color: 'orange' },
  DELETE_LINK: { text: '删除短链接', color: 'red' },
  CLICK_LINK: { text: '访问短链接', color: 'green' },

  // 用户相关
  LOGIN: { text: '用户登录', color: 'cyan' },
  LOGOUT: { text: '用户登出', color: 'grey' },
  REGISTER: { text: '用户注册', color: 'purple' },
  UPDATE_PASSWORD: { text: '更新密码', color: 'orange' },
  USER_UPDATE: { text: '更新用户信息', color: 'cyan' },
  USER_CREATE: { text: '创建用户', color: 'blue' },
  USER_DELETE: { text: '删除用户', color: 'red' },

  // 角色相关
  ROLE_CREATE: { text: '创建角色', color: 'blue' },
  ROLE_UPDATE: { text: '更新角色', color: 'orange' },
  ROLE_DELETE: { text: '删除角色', color: 'red' },

  // 域名相关
  CREATE_DOMAIN: { text: '添加域名', color: 'green' },
  UPDATE_DOMAIN: { text: '更新域名', color: 'orange' },
  DELETE_DOMAIN: { text: '删除域名', color: 'red' },
  VERIFY_DOMAIN: { text: '验证域名', color: 'cyan' },
  DOMAIN_VERIFY: { text: '域名验证', color: 'blue' },

  // 角色分配相关
  ASSIGN_ROLE: { text: '分配角色', color: 'blue' },
  REVOKE_ROLE: { text: '撤销角色', color: 'red' },

  // 权限相关
  CREATE_PERMISSION: { text: '创建权限', color: 'blue' },
  UPDATE_PERMISSION: { text: '更新权限', color: 'orange' },
  DELETE_PERMISSION: { text: '删除权限', color: 'red' },
} as const;

/**
 * 定义操作类型
 */
export type ActionType = keyof typeof ACTION_MAP;

/**
 * 资源类型映射
 */
export const RESOURCE_TYPE_MAP = {
  LINK: { text: '短链接', color: 'blue' },
  USER: { text: '用户', color: 'green' },
  ROLE: { text: '角色', color: 'purple' },
  DOMAIN: { text: '域名', color: 'orange' },
} as const;

/**
 * 定义资源类型
 */
export type ResourceType = keyof typeof RESOURCE_TYPE_MAP;
