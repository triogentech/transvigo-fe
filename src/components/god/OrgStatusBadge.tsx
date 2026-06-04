import React from 'react';

export function OrgStatusBadge({ org }: { org: { isActive: boolean; suspendedReason?: string | null } }) {
  const deleted = !org.isActive && org.suspendedReason === 'DELETED';
  const s = deleted
    ? { label: 'Deleted', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)' }
    : org.isActive
      ? { label: 'Active', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.4)' }
      : { label: 'Suspended', color: '#fcd34d', bg: 'rgba(217,119,6,0.14)', border: 'rgba(217,119,6,0.4)' };
  return (
    <span className="inline-flex items-center gap-1.5 font-body font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}
export default OrgStatusBadge;
