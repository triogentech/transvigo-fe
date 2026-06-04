import { useCallback, useEffect, useState } from 'react';
import * as adminApi from '../api/admin.api';
import { errMessage } from '../api/client';
import type { OrgUser, Role, RolePermission } from '../types/api.types';

// ── useRoles ────────────────────────────────────────────────────────────────

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getRoles();
      setRoles(res);
    } catch (err) {
      setError(errMessage(err, 'Failed to load roles'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  return { roles, loading, error, refetch };
}

// ── useRolePermissions ───────────────────────────────────────────────────────

export function useRolePermissions(roleId: string | null) {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!roleId) { setPermissions([]); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getRolePermissions(roleId);
      setPermissions(res);
    } catch (err) {
      setError(errMessage(err, 'Failed to load role permissions'));
    } finally {
      setLoading(false);
    }
  }, [roleId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const updatePermissions = async (perms: RolePermission[]) => {
    if (!roleId) return;
    await adminApi.updateRolePermissions(roleId, perms);
    await refetch();
  };

  return { permissions, loading, error, refetch, updatePermissions };
}

// ── useOrgUsers ──────────────────────────────────────────────────────────────

export function useOrgUsers() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getOrgUsers();
      setUsers(res);
    } catch (err) {
      setError(errMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const inviteUser = async (body: Parameters<typeof adminApi.inviteUser>[0]) => {
    const result = await adminApi.inviteUser(body);
    await refetch();
    return result;
  };

  const changeUserRole = async (userId: string, roleId: string) => {
    const user = await adminApi.changeUserRole(userId, roleId);
    await refetch();
    return user;
  };

  const resetUserPassword = async (userId: string, newPassword?: string) => {
    const result = await adminApi.resetUserPassword(userId, newPassword);
    await refetch();
    return result;
  };

  const deactivateUser = async (userId: string) => {
    await adminApi.deactivateUser(userId);
    await refetch();
  };

  return { users, loading, error, refetch, inviteUser, changeUserRole, resetUserPassword, deactivateUser };
}
