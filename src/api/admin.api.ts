import { get, post, put, del } from './client';
import type { Role, RolePermission, ModuleSlug, OrgUser } from '../types/api.types';

export const getRoles = (): Promise<Role[]> =>
  get<{ data: Role[] }>('/api/admin/roles').then((r) => r.data);

export const getRolePermissions = (roleId: string): Promise<RolePermission[]> =>
  get<{ data: RolePermission[] }>('/api/admin/roles/' + roleId + '/permissions').then((r) => r.data);

export interface UpdatePermissionEntry {
  module: ModuleSlug;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export const updateRolePermissions = (
  roleId: string,
  permissions: UpdatePermissionEntry[],
): Promise<RolePermission[]> =>
  put<{ data: RolePermission[] }>('/api/admin/roles/' + roleId + '/permissions', permissions).then(
    (r) => r.data,
  );

export const getOrgUsers = (): Promise<OrgUser[]> =>
  get<{ data: OrgUser[] }>('/api/admin/users').then((r) => r.data);

export interface UserCredentialResult {
  user: OrgUser;
  /** Present (generated) when the admin didn't set a password; share securely. */
  tempPassword: string | null;
}

export const inviteUser = (body: {
  email: string;
  username: string;
  roleId: string;
  password?: string;
}): Promise<UserCredentialResult> =>
  post<UserCredentialResult>('/api/admin/users', body);

export const changeUserRole = (userId: string, roleId: string): Promise<OrgUser> =>
  put<{ user: OrgUser }>('/api/admin/users/' + userId + '/role', { roleId }).then((r) => r.user);

/** Reset a member's password. Omit newPassword to generate a temporary one. */
export const resetUserPassword = (
  userId: string,
  newPassword?: string,
): Promise<{ message: string; tempPassword: string | null }> =>
  post<{ message: string; tempPassword: string | null }>(
    '/api/admin/users/' + userId + '/reset-password',
    { newPassword },
  );

export const deactivateUser = (userId: string): Promise<void> =>
  del<void>('/api/admin/users/' + userId);
