import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_PERMISSIONS } from '../lib/permissions-defaults';
import type { ModuleSlug, PermissionAction } from '../types/api.types';

interface PermissionsValue {
  hasPermission: (module: ModuleSlug, action: PermissionAction) => boolean;
  loading: boolean;
}

const PermissionsCtx = createContext<PermissionsValue>({ hasPermission: () => false, loading: false });
export function usePermissions(): PermissionsValue { return useContext(PermissionsCtx); }

/**
 * Client-side permission gating. transvigo-be exposes the permissions matrix
 * only on an Admin-only endpoint, so for gating we use the known seeded
 * defaults keyed by role name (Admin = all). The server still enforces the
 * real permissions on every request; the Roles admin page edits live
 * permissions via the admin API.
 */
export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const value = useMemo<PermissionsValue>(() => ({
    loading: false,
    hasPermission: (module, action) => {
      if (!user) return false;
      if (user.roleName === 'Admin') return true;
      return DEFAULT_PERMISSIONS[user.roleName]?.[module]?.[action] ?? false;
    },
  }), [user]);
  return <PermissionsCtx.Provider value={value}>{children}</PermissionsCtx.Provider>;
}
