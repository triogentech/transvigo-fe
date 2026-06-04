import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import type { AuthUser, ModuleSlug, PermissionAction } from '../types/api.types';

export function AccessDenied({ detail }: { detail?: string }) {
  return (
    <div className="animate-fadeIn flex flex-col items-center justify-center gap-3 py-24">
      <ShieldAlert size={32} style={{ color: 'var(--danger)' }} />
      <div className="font-display font-semibold" style={{ fontSize: 18, color: 'var(--text-primary)' }}>Access denied</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{detail ?? "You don't have permission to view this page."}</div>
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-teal)' }} />
    </div>
  );
}

export function RequireAuth({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user?.mustChangePwd && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <>{children ?? <Outlet />}</>;
}

export function RequirePermission({ module, action, children }: {
  module: ModuleSlug; action: PermissionAction; children: React.ReactNode;
}) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(module, action)) return <AccessDenied />;
  return <>{children}</>;
}

export function RequireRole({ roles, children }: {
  roles: Array<AuthUser['roleName']>; children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.roleName)) return <AccessDenied />;
  return <>{children}</>;
}
