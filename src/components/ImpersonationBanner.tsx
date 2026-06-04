import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { gPost } from '../api/god/client';
import { clearImpersonation, getImpersonationMeta } from '../lib/impersonation';

// Tenant-side banner shown whenever an impersonation session is active. Always
// visible, cannot be dismissed. Counts down to the 15-minute hard expiry.
export function ImpersonationBanner() {
  const navigate = useNavigate();
  const [meta] = useState(getImpersonationMeta);
  const [remaining, setRemaining] = useState(() =>
    meta ? Math.max(0, Math.floor((new Date(meta.expiresAt).getTime() - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!meta) return;
    const id = setInterval(() => {
      const secs = Math.max(0, Math.floor((new Date(meta.expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(id);
        clearImpersonation();
        navigate(`/god/organisations/${meta.targetOrg.id}`, { replace: true });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [meta, navigate]);

  if (!meta) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const end = async () => {
    try { await gPost(`/platform/impersonation/${meta.sessionId}/end`); } catch { /* best-effort */ }
    clearImpersonation();
    navigate(`/god/organisations/${meta.targetOrg.id}`, { replace: true });
  };

  return (
    <div className="flex items-center justify-between px-4" style={{ height: 48, background: '#d97706', color: '#0a0a0a' }}>
      <div className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
        <Zap size={16} />
        <span>IMPERSONATION ACTIVE — Acting as {meta.targetUser.username} ({meta.targetUser.roleName}) in {meta.targetOrg.name}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono" style={{ fontSize: 14, fontWeight: 600 }}>{mm}:{ss} remaining</span>
        <button onClick={end} style={{ background: '#0a0a0a', color: '#fff', borderRadius: 6, padding: '6px 12px', fontSize: 13, fontWeight: 600 }}>
          End Impersonation
        </button>
      </div>
    </div>
  );
}
export default ImpersonationBanner;
