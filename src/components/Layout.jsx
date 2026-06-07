// ── SECTION: Layout Shell (Sidebar + Topbar) ──
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import * as Separator from '@radix-ui/react-separator';
import {
  AlertTriangle, ArrowRight, BarChart3, Bell, Building2, CheckCircle2, CircleDot, ClipboardList, CreditCard, FileSearch,
  Fuel, Info, Landmark, LayoutDashboard, LogOut, MapPin, Moon, Package,
  PackageSearch, ReceiptText, Route as RouteIcon, Search, ShieldCheck, Sun, Truck,
  UserCog, Users, Warehouse, Wrench, Zap,
} from 'lucide-react';
import { TVAvatar, Popover } from './ui.jsx';
import { ImpersonationBanner } from './ImpersonationBanner.tsx';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import { useTrips } from '../hooks/useTrips';
import { useVehicles } from '../hooks/useVehicles';
import { useDrivers } from '../hooks/useDrivers';
import { useDashboard } from '../hooks/useDashboard';
import { useActivityLogs } from '../hooks/useActivityLogs';

// ── Nav config ──
// Each item carries an optional `permission` (module slug) and optional `adminOnly` flag.
// Dashboard and Live Map have no permission gate (always visible once logged in).
const NAV = [
  { group: 'OPERATIONS', items: [
    { label: 'Dashboard',  icon: LayoutDashboard, to: '/' },
    { label: 'Trips',      icon: RouteIcon,        to: '/trips',       permission: 'trips' },
    { label: 'Tickets',    icon: AlertTriangle,     to: '/tickets',     permission: 'tickets' },
    { label: 'Analytics',  icon: BarChart3,         to: '/analytics',   permission: 'vehicles' },
    { label: 'Live Map',   icon: MapPin,            to: '/map',         badge: 'Soon' },
  ]},
  { group: 'WORKSHOP', items: [
    { label: 'Job Cards',   icon: ClipboardList, to: '/job-cards',   permission: 'job-cards' },
    { label: 'Spare Parts', icon: Package,       to: '/spare-parts', permission: 'spare-parts' },
    { label: 'Tyre Hub',    icon: CircleDot,     to: '/tyres',       permission: 'tyre-management' },
  ]},
  { group: 'FLEET', items: [
    { label: 'Vehicles',    icon: Truck,   to: '/vehicles',    permission: 'vehicles' },
    { label: 'Drivers',     icon: Users,   to: '/drivers',     permission: 'drivers' },
    { label: 'Fuel Logs',   icon: Fuel,    to: '/fuel-logs',   permission: 'fuel-logs' },
    { label: 'Maintenance', icon: Wrench,  to: '/maintenance', permission: 'garage-logs' },
  ]},
  { group: 'FINANCE', items: [
    { label: 'Transactions', icon: CreditCard, to: '/transactions', permission: 'transactions' },
    { label: 'Toll Logs',    icon: Landmark,   to: '/toll-logs',    permission: 'toll-logs' },
    { label: 'Invoices',     icon: ReceiptText, to: '/invoices',    permission: 'invoices' },
  ]},
  { group: 'MASTER DATA', items: [
    { label: 'Cities',          icon: Building2,   to: '/cities',          permission: 'cities' },
    { label: 'Load Providers',  icon: PackageSearch, to: '/load-providers', permission: 'load-providers' },
    { label: 'Fuel Stations',   icon: Zap,         to: '/fuel-stations',   permission: 'fuel-stations' },
    { label: 'Garages',         icon: Warehouse,   to: '/garages',         permission: 'garages' },
  ]},
  { group: 'ADMIN', items: [
    { label: 'Team',          icon: UserCog,    to: '/admin/users',  adminOnly: true },
    { label: 'Roles & Perms', icon: ShieldCheck, to: '/admin/roles', adminOnly: true },
    { label: 'Audit Log',     icon: FileSearch,  to: '/admin/audit', permission: 'activity-logs' },
  ]},
];

// ── Sidebar ──
function Sidebar() {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const isAdmin = user?.roleName === 'Admin';

  const visibleGroups = NAV
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        if (it.adminOnly) return isAdmin;
        if (it.permission) return hasPermission(it.permission, 'canRead');
        return true; // Dashboard, Live Map — always visible
      }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <aside className="fixed left-0 top-0 bottom-0 flex flex-col" style={{ width: 240, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', zIndex: 30 }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 group" style={{ height: 64, borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="font-display font-bold" style={{ fontSize: 18, color: 'var(--accent-navy)', letterSpacing: '-0.01em' }}>TRANSVIGO</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: -1 }}>Moving Business Forward</div>
        </div>
        <ArrowRight size={16} style={{ color: 'var(--accent-teal)', transition: 'transform 150ms ease' }} className="group-hover:translate-x-[2px]" />
      </div>

      {/* Org strip */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user?.orgName || 'Organisation'}</span>
        {user?.roleName && (
          <span className="font-medium uppercase" style={{ fontSize: 10, background: 'var(--status-info-bg)', color: 'var(--status-info-text)', border: '1px solid var(--status-info-border)', padding: '1px 6px', borderRadius: 4 }}>{user.roleName}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 pr-2">
        {visibleGroups.map((g) => (
          <div key={g.group} className="mb-4">
            <div className="px-4 mb-1.5 uppercase font-medium" style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>{g.group}</div>
            {g.items.map((it) => (
              <NavLink key={it.to + it.label} to={it.to} end={it.to === '/'} className="block">
                {({ isActive }) => (
                  <div
                    className="flex items-center gap-2.5 transition-colors"
                    style={{
                      color: isActive ? 'var(--accent-navy)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--status-info-bg)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent-navy)' : '3px solid transparent',
                      borderRadius: '0 6px 6px 0',
                      padding: '8px 12px 8px 13px',
                      fontWeight: isActive ? 500 : 400,
                    }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                  >
                    <it.icon size={16} style={{ color: isActive ? 'var(--accent-navy)' : 'inherit' }} />
                    <span style={{ fontSize: 13 }}>{it.label}</span>
                    {it.badge && <span className="ml-auto uppercase font-medium" style={{ fontSize: 9, color: 'var(--status-pending-text)', background: 'var(--status-pending-bg)', border: '1px solid var(--status-pending-border)', padding: '0 5px', borderRadius: 4 }}>{it.badge}</span>}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: 'var(--bg-sunken)', borderTop: '1px solid var(--border)' }}>
        <TVAvatar name={user?.username ?? ''} size={34} />
        <div className="flex-1 min-w-0">
          <div className="truncate" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{user?.username}</div>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user?.roleName}</span>
        </div>
        <button className="p-1.5 rounded transition-colors" style={{ color: 'var(--text-tertiary)' }} title="Log out" onClick={logout}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

// ── Theme toggle ──
function ThemeToggle() {
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };
  return (
    <button onClick={toggle} className="btn-ghost p-2" title="Toggle theme" aria-label="Toggle theme">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

// ── Global Search (⌘K) ──
// transvigo-be has no search endpoint — filtering client-side from loaded lists.
// The entity lists are only fetched while the dialog is open: this component is
// rendered inside <Dialog.Content>, which Radix mounts only when open. Keeping
// these hooks out of the always-mounted shell stops trips/vehicles/drivers from
// being fetched on every page load.
function SearchResults({ debouncedQ, onGo }) {
  const { allTrips } = useTrips();
  const { allVehicles } = useVehicles();
  const { allDrivers } = useDrivers();

  const ql = debouncedQ.toLowerCase();
  const results = useMemo(() => ({
    Trips: allTrips
      .filter((t) => !debouncedQ || `${t.tripNumber} ${t.startPoint} ${t.endPoint}`.toLowerCase().includes(ql))
      .slice(0, 5),
    Vehicles: allVehicles
      .filter((v) => !debouncedQ || `${v.vehicleNumber} ${v.model ?? ''}`.toLowerCase().includes(ql))
      .slice(0, 5),
    Drivers: allDrivers
      .filter((d) => !debouncedQ || `${d.fullName} ${d.contactNumber}`.toLowerCase().includes(ql))
      .slice(0, 5),
  }), [debouncedQ, ql, allTrips, allVehicles, allDrivers]);

  return (
    <div className="max-h-80 overflow-y-auto py-2">
      {Object.entries(results).map(([group, items]) => items.length > 0 && (
        <div key={group} className="mb-1">
          <div className="px-4 py-1 uppercase font-medium" style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>{group}</div>
          {items.map((it) => {
            const isTrip = group === 'Trips', isVeh = group === 'Vehicles';
            const primary = isTrip ? it.tripNumber : isVeh ? it.vehicleNumber : it.fullName;
            const secondary = isTrip ? `${it.startPoint} → ${it.endPoint}` : isVeh ? (it.model ?? '') : it.contactNumber;
            const to = isTrip ? '/trips' : isVeh ? '/vehicles' : '/drivers';
            const Icon = isTrip ? RouteIcon : isVeh ? Truck : Users;
            return (
              <button key={it.id} onClick={() => onGo(to)} className="w-full flex items-center gap-3 px-4 py-2 text-left" onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <Icon size={15} style={{ color: 'var(--text-tertiary)' }} />
                <span className="font-mono" style={{ fontSize: 13, color: 'var(--accent-teal)' }}>{primary}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{secondary}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const navigate = useNavigate();

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Debounce input 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const go = (to) => { setOpen(false); setQ(''); navigate(to); };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-tertiary)', fontSize: 13, minWidth: 200 }}>
        <Search size={14} /> <span className="font-mono" style={{ fontSize: 12 }}>⌘K</span> <span>Search…</span>
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="radix-overlay" />
          <Dialog.Content className="radix-content fixed left-1/2 top-24 -translate-x-1/2 z-50" style={{ width: 'min(560px, calc(100vw - 32px))', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
            <Dialog.Title className="sr-only">Search</Dialog.Title>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trips, vehicles, drivers…" className="flex-1 bg-transparent outline-none" style={{ color: 'var(--text-primary)', fontSize: 14 }} />
            </div>
            {open && <SearchResults debouncedQ={debouncedQ} onGo={go} />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

// ── Notifications ──
const NOTIF_ICON = {
  danger:  <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />,
  warning: <AlertTriangle size={15} style={{ color: 'var(--warning)' }} />,
  info:    <Info size={15} style={{ color: 'var(--accent-teal)' }} />,
  success: <CheckCircle2 size={15} style={{ color: 'var(--success)' }} />,
};

/** Formats an ISO timestamp as a human-readable relative time string. */
function relTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Data is fetched only while the popover is open — this content renders inside
// the Radix Popover.Portal, which mounts on open. Previously useDashboard()
// (trips + vehicles + transactions) and useActivityLogs() ran on every page.
function NotificationContent() {
  const { complianceAlerts } = useDashboard();
  const { allLogs } = useActivityLogs();

  const topAlerts = complianceAlerts.slice(0, 6);
  const recentActivity = allLogs.slice(0, 5);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="font-display font-semibold" style={{ fontSize: 14, color: 'var(--text-primary)' }}>Notifications</span>
      </div>
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
        {/* Document Expiry */}
        {topAlerts.length > 0 && (
          <div>
            <div className="uppercase font-medium mb-1" style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>Document Expiry</div>
            {topAlerts.map((a) => (
              <div key={`${a.vehicleId}-${a.documentType}`} className="flex items-start gap-2 py-1.5">
                {a.daysLeft < 14 ? NOTIF_ICON.danger : NOTIF_ICON.warning}
                <div className="flex-1">
                  <div style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
                    {a.vehicleNumber} {a.documentType} expires in {a.daysLeft}d
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{a.expiryDate.slice(0, 10)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div>
            <div className="uppercase font-medium mb-1" style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>Recent Activity</div>
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-start gap-2 py-1.5">
                {NOTIF_ICON.info}
                <div className="flex-1">
                  <div style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{log.note}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{relTime(log.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {topAlerts.length === 0 && recentActivity.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>No notifications</div>
        )}
      </div>
    </>
  );
}

function NotificationBell() {
  return (
    <Popover width={340} trigger={
      <button className="relative p-2 rounded" style={{ color: 'var(--text-secondary)' }}>
        <Bell size={18} />
      </button>
    }>
      <NotificationContent />
    </Popover>
  );
}

// ── Topbar ──
function Topbar() {
  const { user } = useAuth();
  return (
    <header className="flex items-center justify-end gap-3 px-6 sticky top-0 z-20" style={{ height: 56, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
      <GlobalSearch />
      <ThemeToggle />
      <NotificationBell />
      <Separator.Root orientation="vertical" style={{ width: 1, height: 24, background: 'var(--border)' }} />
      <div className="flex items-center gap-2">
        <TVAvatar name={user?.username ?? ''} size={30} />
        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{user?.username}</span>
      </div>
    </header>
  );
}

// ── Module placeholder (un-built nav modules; not Live Map) ──
export function ModulePlaceholder({ title }) {
  return (
    <div className="animate-fadeIn">
      <h1 className="font-display font-semibold mb-6" style={{ fontSize: 20, color: 'var(--text-primary)' }}>{title}</h1>
      <div className="tv-card flex flex-col items-center justify-center gap-3 py-20" style={{ borderStyle: 'dashed' }}>
        <RouteIcon size={28} style={{ color: 'var(--text-tertiary)' }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{title} module — part of the TRANSVIGO roadmap</div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Connect the backend API to populate this module.</div>
      </div>
    </div>
  );
}

export function LiveMapPlaceholder() {
  return (
    <div className="animate-fadeIn">
      <h1 className="font-display font-semibold mb-6" style={{ fontSize: 20, color: 'var(--text-primary)' }}>Live Map</h1>
      <div className="tv-card flex flex-col items-center justify-center gap-3 py-20" style={{ borderStyle: 'dashed' }}>
        <MapPin size={28} style={{ color: 'var(--warning)' }} />
        <div style={{ color: 'var(--text-primary)', fontSize: 16 }}>Real-time fleet tracking</div>
        <span className="uppercase font-medium" style={{ fontSize: 11, color: 'var(--status-pending-text)', background: 'var(--status-pending-bg)', border: '1px solid var(--status-pending-border)', padding: '2px 10px', borderRadius: 4 }}>Coming Soon</span>
      </div>
    </div>
  );
}

// ── Layout ──
export default function Layout() {
  const location = useLocation();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />
      <div style={{ marginLeft: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ImpersonationBanner />
        <Topbar />
        <main key={location.pathname} className="flex-1 animate-fadeIn" style={{ padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
