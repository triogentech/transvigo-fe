import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Building2, ClipboardList, Crown, Eye, LayoutDashboard, PlusCircle,
  Settings, ShieldAlert, Zap,
} from 'lucide-react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { GodModeStatusBar } from '../components/god/GodModeStatusBar';
import { gGet } from '../api/god/client';

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  SUPER_ADMIN: { bg: 'rgba(217,119,6,0.18)', text: '#fcd34d' },
  SUPPORT_ADMIN: { bg: 'rgba(59,130,246,0.18)', text: '#93c5fd' },
  BILLING_ADMIN: { bg: 'rgba(74,222,128,0.16)', text: '#86efac' },
};

export default function GodModeShell() {
  const { admin } = usePlatformAuth();
  const isSuper = admin?.role === 'SUPER_ADMIN';
  const [pending, setPending] = useState(0);
  const [activeImp, setActiveImp] = useState(0);

  useEffect(() => {
    gGet<{ data: unknown[] }>('/platform/onboarding-requests', { status: 'PENDING', pageSize: 100 })
      .then((r) => setPending(r.data.length)).catch(() => undefined);
    gGet<{ data: unknown[] }>('/platform/impersonation/active')
      .then((r) => setActiveImp(r.data.length)).catch(() => undefined);
  }, []);

  const groups: Array<{ group: string; items: Array<{ label: string; to: string; icon: typeof Building2; end?: boolean; badge?: number; superOnly?: boolean }> }> = [
    { group: 'OVERVIEW', items: [{ label: 'Dashboard', to: '/god', icon: LayoutDashboard, end: true }] },
    { group: 'ORGANISATIONS', items: [
      { label: 'All Organisations', to: '/god/organisations', icon: Building2 },
      { label: 'Onboarding Requests', to: '/god/onboarding-requests', icon: ClipboardList, badge: pending || undefined },
      { label: 'Create New', to: '/god/organisations/new', icon: PlusCircle },
    ]},
    { group: 'MONITORING', items: [
      { label: 'Active Impersonations', to: '/god/impersonation', icon: Eye, badge: activeImp || undefined },
      { label: 'Platform Audit Log', to: '/god/audit-log', icon: ShieldAlert },
    ]},
    { group: 'PLATFORM', items: [
      { label: 'Platform Admins', to: '/god/platform-admins', icon: Crown, superOnly: true },
      { label: 'Settings', to: '/god/settings', icon: Settings, superOnly: true },
    ]},
  ];

  return (
    <div className="god-mode" style={{ minHeight: '100vh' }}>
      <GodModeStatusBar />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 36px)' }}>
        <aside className="flex flex-col" style={{ width: 240, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
          <div className="px-4 flex flex-col justify-center" style={{ height: 64, borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5">
              <Zap size={16} style={{ color: 'var(--god-accent)' }} />
              <span className="font-display font-bold" style={{ color: 'var(--god-accent)', letterSpacing: '0.15em', fontSize: 15 }}>GOD MODE</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>Transvigo Platform</div>
          </div>

          <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="truncate" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{admin?.fullName}</div>
            {admin && (
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, ...ROLE_BADGE[admin.role] }}>{admin.role}</span>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-3">
            {groups.map((g) => {
              const items = g.items.filter((it) => !it.superOnly || isSuper);
              if (!items.length) return null;
              return (
                <div key={g.group} className="mb-4">
                  <div className="px-4 mb-1.5 uppercase font-medium" style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>{g.group}</div>
                  {items.map((it) => (
                    <NavLink key={it.to} to={it.to} end={it.end}>
                      {({ isActive }) => (
                        <div className="flex items-center gap-2.5" style={{
                          padding: '8px 12px 8px 13px',
                          color: isActive ? 'var(--god-accent-text)' : 'var(--text-secondary)',
                          background: isActive ? 'var(--god-accent-dim)' : 'transparent',
                          borderLeft: `3px solid ${isActive ? 'var(--god-accent)' : 'transparent'}`,
                        }}>
                          <it.icon size={16} style={{ color: isActive ? 'var(--god-accent)' : 'inherit' }} />
                          <span style={{ fontSize: 13 }}>{it.label}</span>
                          {it.badge != null && (
                            <span className="ml-auto font-mono" style={{ fontSize: 10, background: 'var(--god-accent)', color: '#0a0a0a', borderRadius: 99, padding: '0 6px' }}>{it.badge}</span>
                          )}
                        </div>
                      )}
                    </NavLink>
                  ))}
                </div>
              );
            })}
          </nav>

          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <Link to="/" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>← Back to Tenant Dashboard</Link>
          </div>
        </aside>

        <main className="flex-1 animate-fadeIn" style={{ padding: 24, background: 'var(--bg-page)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
