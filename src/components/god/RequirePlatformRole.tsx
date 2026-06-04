import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { usePlatformAuth } from '../../context/PlatformAuthContext';
import type { PlatformRole } from '../../types/god.types';

export function RequirePlatformRole({ roles, children }: { roles: PlatformRole[]; children: React.ReactNode }) {
  const { admin } = usePlatformAuth();
  if (!admin || !roles.includes(admin.role)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <ShieldAlert size={32} style={{ color: 'var(--god-accent)' }} />
        <div className="font-display font-semibold" style={{ fontSize: 18, color: 'var(--text-primary)' }}>Insufficient platform role</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>This area requires: {roles.join(', ')}</div>
      </div>
    );
  }
  return <>{children}</>;
}

export default RequirePlatformRole;
