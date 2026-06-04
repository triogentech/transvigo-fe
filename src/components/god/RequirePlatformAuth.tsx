import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePlatformAuth } from '../../context/PlatformAuthContext';

export function RequirePlatformAuth({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading } = usePlatformAuth();
  if (isLoading) {
    return (
      <div className="god-mode flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--god-accent)' }} />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/god/login" replace />;
  return <>{children ?? <Outlet />}</>;
}

export default RequirePlatformAuth;
