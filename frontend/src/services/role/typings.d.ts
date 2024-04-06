export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  _id: string;
  name: string;
  code: string;
  description?: string;
  type: 'menu' | 'operation';
}

export interface RoleListResult {
  data: Role[];
  total: number;
  success: boolean;
}

export interface RoleItem {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
}
