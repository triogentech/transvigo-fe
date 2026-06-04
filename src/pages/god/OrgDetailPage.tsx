import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer,
} from 'recharts';
import {
  RefreshCw, Users, Car, MapPin, TrendingUp, Fuel, DollarSign, UserX, Trash2, PlayCircle,
} from 'lucide-react';
import { useGodOrgDetailPage } from '../../hooks/god/useGodOrgDetail';
import { useOrganisations } from '../../hooks/god/useOrganisations';
import { useImpersonation } from '../../hooks/god/useImpersonation';
import { startImpersonation } from '../../api/god/impersonation.api';
import { setImpersonation } from '../../lib/impersonation';
import { godErr } from '../../api/god/client';
import { useToast } from '../../context/ToastContext';
import { PlanBadge } from '../../components/god/PlanBadge';
import { OrgStatusBadge } from '../../components/god/OrgStatusBadge';
import { SkeletonCard, SkeletonTable, ErrorBanner, LoadingButton } from '../../components/states';
import { formatINR, shortDate, relTime } from '../../lib/utils.js';
import type { OrgUserRow, OrgStats } from '../../types/god.types';
import type { GodOrgDetailPage } from '../../api/god/pages.api';

// ui.jsx exports — JS module, props typed loosely
import {
  PageHeader as _PageHeader,
  DataTable as _DataTable,
  Modal as _Modal,
  TVSelect as _TVSelect,
  TVProgress as _TVProgress,
  StatCard as _StatCard,
  Card as _Card,
} from '../../components/ui.jsx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PageHeader = _PageHeader as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataTable = _DataTable as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Modal = _Modal as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TVSelect = _TVSelect as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TVProgress = _TVProgress as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StatCard = _StatCard as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Card = _Card as React.FC<any>;

const TAB_STYLE_BASE: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  borderBottom: '2px solid transparent',
  marginBottom: -1,
  fontFamily: 'var(--font-body)',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'color 0.15s',
};

// ── Impersonate Modal ─────────────────────────────────────────────────────

interface ImpersonateModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  orgSlug: string;
  users: OrgUserRow[];
  defaultUserId?: string;
}

function ImpersonateModal({ open, onClose, orgId, orgName, orgSlug, users, defaultUserId }: ImpersonateModalProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [userId, setUserId] = useState(defaultUserId ?? '');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setReason(''); setErr(null); setBusy(false); }
    if (open && defaultUserId) setUserId(defaultUserId);
  }, [open, defaultUserId]);

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.username} — ${u.email}${u.role?.name ? ` (${u.role.name})` : ''}`,
  }));

  const submit = async () => {
    if (!reason.trim() || reason.trim().length < 10) {
      setErr('Reason must be at least 10 characters');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await startImpersonation(orgId, { targetUserId: userId || undefined, reason: reason.trim() });
      setImpersonation(res.impersonationToken, {
        sessionId: res.sessionId,
        expiresAt: res.expiresAt,
        reason: reason.trim(),
        targetUser: res.targetUser,
        targetOrg: { id: orgId, name: orgName, slug: orgSlug },
      });
      toast.success(`Impersonating ${res.targetUser.username}`);
      onClose();
      navigate('/');
    } catch (e) {
      setErr(godErr(e, 'Failed to start impersonation'));
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v: boolean) => !v && onClose()}
      title="Impersonate User"
      width={500}
      footer={
        <>
          <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={onClose}>
            Cancel
          </button>
          <LoadingButton
            loading={busy}
            className="god-accent-btn"
            style={{ padding: '7px 16px', fontSize: 13 }}
            onClick={() => void submit()}
          >
            Start Impersonation
          </LoadingButton>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
        You will be signed in as the selected user inside <strong>{orgName}</strong>. All actions will be logged.
      </p>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5, fontWeight: 500 }}>
          Target User
        </label>
        <TVSelect
          value={userId}
          onValueChange={(v: string) => setUserId(v)}
          options={[{ value: '', label: 'Org-level (no specific user)' }, ...userOptions]}
          placeholder="Select user…"
        />
      </div>

      <div style={{ marginBottom: 4 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5, fontWeight: 500 }}>
          Reason <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 6, color: 'var(--text-dim)' }}>min. 10 chars</span>
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Customer support investigation for ticket #1234"
          style={{
            width: '100%',
            resize: 'vertical',
            padding: '8px 10px',
            fontSize: 13,
            background: 'var(--bg-sunken)',
            border: '1px solid var(--border-strong)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            boxSizing: 'border-box',
          }}
        />
        {err && <p style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 5 }}>{err}</p>}
      </div>
    </Modal>
  );
}

// ── Suspend Modal ─────────────────────────────────────────────────────────

interface SuspendModalProps {
  open: boolean;
  onClose: () => void;
  orgName: string;
  onConfirm: (reason: string) => Promise<void>;
}

function SuspendModal({ open, onClose, orgName, onConfirm }: SuspendModalProps) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setReason(''); setErr(null); setBusy(false); }
  }, [open]);

  const submit = async () => {
    if (!reason.trim()) { setErr('Reason is required'); return; }
    setBusy(true);
    setErr(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (e) {
      setErr(godErr(e, 'Failed to suspend'));
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v: boolean) => !v && onClose()}
      title={`Suspend: ${orgName}`}
      width={480}
      footer={
        <>
          <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={onClose}>Cancel</button>
          <LoadingButton
            loading={busy}
            className="god-accent-btn"
            style={{ padding: '7px 16px', fontSize: 13 }}
            onClick={() => void submit()}
          >
            Suspend Organisation
          </LoadingButton>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
        All users of <strong>{orgName}</strong> will be locked out immediately.
      </p>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5, fontWeight: 500 }}>
        Reason <span style={{ color: 'var(--status-danger-text)' }}>*</span>
      </label>
      <textarea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Payment overdue / Policy violation"
        style={{ width: '100%', resize: 'vertical', padding: '8px 10px', fontSize: 13, background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
      />
      {err && <p style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 5 }}>{err}</p>}
    </Modal>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  orgSlug: string;
  orgName: string;
  onConfirm: () => Promise<void>;
}

function DeleteModal({ open, onClose, orgSlug, orgName, onConfirm }: DeleteModalProps) {
  const [typedSlug, setTypedSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setTypedSlug(''); setErr(null); setBusy(false); }
  }, [open]);

  const submit = async () => {
    if (typedSlug !== orgSlug) { setErr(`Type "${orgSlug}" to confirm`); return; }
    setBusy(true);
    setErr(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setErr(godErr(e, 'Failed to delete'));
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v: boolean) => !v && onClose()}
      title="Delete Organisation"
      width={480}
      footer={
        <>
          <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={onClose}>Cancel</button>
          <LoadingButton
            loading={busy}
            disabled={typedSlug !== orgSlug}
            style={{ padding: '7px 16px', fontSize: 13, background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', border: '1px solid var(--status-danger-border)', borderRadius: 8, fontWeight: 500, cursor: typedSlug !== orgSlug ? 'not-allowed' : 'pointer' }}
            onClick={() => void submit()}
          >
            Permanently Delete
          </LoadingButton>
        </>
      }
    >
      <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
        This action is <strong>irreversible</strong>. All data for <strong>{orgName}</strong> will be permanently deleted.
      </div>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5, fontWeight: 500 }}>
        Type <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{orgSlug}</span> to confirm
      </label>
      <input
        type="text"
        value={typedSlug}
        onChange={(e) => setTypedSlug(e.target.value)}
        placeholder={orgSlug}
        style={{ width: '100%', padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--text-primary)', boxSizing: 'border-box' }}
      />
      {err && <p style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 5 }}>{err}</p>}
    </Modal>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────

interface OverviewTabProps {
  orgId: string;
  orgName: string;
  orgSlug: string;
  users: OrgUserRow[];
  stats: OrgStats | null;
  statsLoading: boolean;
  activityTimeline: Array<{ date: string; count: number }>;
  recentTrips: Array<Record<string, unknown>>;
  onSuspend: () => void;
  onReactivate: () => void;
  onDelete: () => void;
  isSuspended: boolean;
  isDeleted: boolean;
}

function OverviewTab({ orgId, orgName, orgSlug, users, stats, statsLoading, activityTimeline, recentTrips, onSuspend, onReactivate, onDelete, isSuspended, isDeleted }: OverviewTabProps) {
  const [impersonateOpen, setImpersonateOpen] = useState(false);

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, accent: '#60a5fa' },
    { title: 'Active Users', value: stats?.activeUsers ?? 0, icon: Users, accent: '#4ade80' },
    { title: 'Vehicles', value: stats?.totalVehicles ?? 0, icon: Car, accent: '#a78bfa' },
    { title: 'Trips MTD', value: stats?.tripsThisMonth ?? 0, icon: MapPin, accent: '#fbbf24' },
    { title: 'Revenue MTD', value: stats?.revenueMtd != null ? formatINR(stats.revenueMtd) : '₹0', icon: TrendingUp, accent: '#34d399', isStr: true },
    { title: 'Fuel Spend', value: stats?.totalFuelSpend != null ? formatINR(stats.totalFuelSpend) : '₹0', icon: Fuel, accent: '#f87171', isStr: true },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
      <div>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {statCards.map((sc) => (
            <StatCard key={sc.title} title={sc.title} accent={sc.accent} icon={sc.icon}>
              {statsLoading ? (
                <div className="skeleton" style={{ height: 28, width: '60%', marginTop: 4 }} />
              ) : (
                <span className={sc.isStr ? '' : 'font-mono'} style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {sc.isStr ? sc.value : String(sc.value)}
                </span>
              )}
            </StatCard>
          ))}
        </div>

        {/* Activity chart */}
        {activityTimeline.length > 0 && (
          <Card style={{ padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Activity Timeline
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={activityTimeline} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickLine={false} axisLine={false} />
                <RechartTooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  itemStyle={{ color: '#fbbf24' }}
                />
                <Area type="monotone" dataKey="count" stroke="#d97706" strokeWidth={2} fill="url(#actGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Recent trips */}
        {recentTrips.length > 0 && (
          <Card style={{ padding: '0 0 8px' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Trips</p>
            </div>
            <DataTable
              columns={[
                { key: 'id', header: 'ID', render: (r: Record<string, unknown>) => <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{String(r.id ?? '').slice(0, 8)}</span> },
                { key: 'status', header: 'Status', render: (r: Record<string, unknown>) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{String(r.status ?? '—')}</span> },
                { key: 'createdAt', header: 'Created', render: (r: Record<string, unknown>) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.createdAt ? relTime(String(r.createdAt)) : '—'}</span> },
              ]}
              data={recentTrips.slice(0, 5)}
              paginate={false}
            />
          </Card>
        )}
      </div>

      {/* Quick actions sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Quick Actions</p>

        <button
          className="god-accent-btn"
          style={{ padding: '9px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
          onClick={() => setImpersonateOpen(true)}
        >
          <PlayCircle size={14} />
          Impersonate Admin
        </button>

        {!isSuspended && !isDeleted && (
          <button
            className="btn-ghost"
            style={{ padding: '9px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', color: '#f59e0b', border: '1px solid rgba(217,119,6,0.4)' }}
            onClick={onSuspend}
          >
            <UserX size={14} />
            Suspend
          </button>
        )}

        {isSuspended && !isDeleted && (
          <button
            className="btn-ghost"
            style={{ padding: '9px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', color: '#4ade80', border: '1px solid rgba(74,222,128,0.4)' }}
            onClick={onReactivate}
          >
            <RefreshCw size={14} />
            Reactivate
          </button>
        )}

        {!isDeleted && (
          <button
            className="btn-ghost"
            style={{ padding: '9px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', color: 'var(--status-danger-text)', border: '1px solid var(--status-danger-border)' }}
            onClick={onDelete}
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>

      <ImpersonateModal
        open={impersonateOpen}
        onClose={() => setImpersonateOpen(false)}
        orgId={orgId}
        orgName={orgName}
        orgSlug={orgSlug}
        users={users}
      />
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────

interface UsersTabProps {
  orgId: string;
  orgName: string;
  orgSlug: string;
  users: OrgUserRow[];
}

function UsersTab({ orgId, orgName, orgSlug, users }: UsersTabProps) {
  const [impersonateUser, setImpersonateUser] = useState<OrgUserRow | null>(null);

  const columns = [
    {
      key: 'username',
      header: 'Username',
      render: (u: OrgUserRow) => <span className="font-mono" style={{ fontSize: 13 }}>{u.username}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (u: OrgUserRow) => <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: OrgUserRow) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.role?.name ?? '—'}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (u: OrgUserRow) => (
        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: u.isActive ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: u.isActive ? '#4ade80' : '#f87171', border: `1px solid ${u.isActive ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}` }}>
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (u: OrgUserRow) => <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{shortDate(u.lastLoginAt ?? null)}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: 110,
      render: (u: OrgUserRow) => (
        <button
          className="god-accent-btn"
          style={{ padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={(e) => { e.stopPropagation(); setImpersonateUser(u); }}
        >
          <PlayCircle size={12} />
          Impersonate
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={users} emptyLabel="No users found" />
      {impersonateUser && (
        <ImpersonateModal
          open={true}
          onClose={() => setImpersonateUser(null)}
          orgId={orgId}
          orgName={orgName}
          orgSlug={orgSlug}
          users={users}
          defaultUserId={impersonateUser.id}
        />
      )}
    </>
  );
}

// ── Billing Tab ───────────────────────────────────────────────────────────

interface BillingTabProps {
  billing: GodOrgDetailPage['organisation']['billing'];
  stats: OrgStats | null;
}

function BillingTab({ billing, stats }: BillingTabProps) {
  if (!billing) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 20 }}>No billing information available.</p>;
  }

  const unlimited = (n: number) => n === -1;

  const usageRows = [
    {
      label: 'Users',
      used: stats?.totalUsers ?? 0,
      max: billing.maxUsers,
    },
    {
      label: 'Vehicles',
      used: stats?.totalVehicles ?? 0,
      max: billing.maxVehicles,
    },
    {
      label: 'Trips / Month',
      used: stats?.tripsThisMonth ?? 0,
      max: billing.maxTripsPerMonth,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      {/* Plan card */}
      <Card style={{ padding: 16 }}>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Plan Details</p>
        <dl style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Plan', value: billing.plan },
            { label: 'Billing Cycle', value: billing.billingCycle },
            { label: 'Billing Email', value: billing.billingEmail ?? '—' },
            { label: 'Subscription ID', value: billing.subscriptionId ?? '—', mono: true },
            { label: 'Trial Status', value: billing.isTrialing ? `Trialing · ends ${shortDate(billing.trialEndsAt ?? null)}` : billing.trialEndsAt ? `Ended ${shortDate(billing.trialEndsAt)}` : 'No trial' },
          ].map(({ label, value, mono }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <dt style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</dt>
              <dd className={mono ? 'font-mono' : ''} style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, margin: 0, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Usage card */}
      <Card style={{ padding: 16 }}>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Usage</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {usageRows.map(({ label, used, max }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                  {unlimited(max)
                    ? <span style={{ color: '#4ade80' }}>Unlimited</span>
                    : <>{used} / {max}</>}
                </span>
              </div>
              {!unlimited(max) && (
                <TVProgress
                  value={max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0}
                  color={used / max > 0.9 ? '#f87171' : used / max > 0.7 ? '#f59e0b' : 'var(--teal)'}
                />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────

function ActivityTab({ recentOrgActivity }: { recentOrgActivity: GodOrgDetailPage['recentOrgActivity'] }) {
  return (
    <DataTable
      columns={[
        {
          key: 'action',
          header: 'Action',
          render: (r: GodOrgDetailPage['recentOrgActivity'][number]) => <span className="font-mono" style={{ fontSize: 12, color: '#fbbf24' }}>{r.action ?? '—'}</span>,
        },
        {
          key: 'collection',
          header: 'Collection',
          render: (r: GodOrgDetailPage['recentOrgActivity'][number]) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.collection ?? '—'}</span>,
        },
        {
          key: 'recordId',
          header: 'Record ID',
          render: (r: GodOrgDetailPage['recentOrgActivity'][number]) => <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{String(r.recordId ?? '—').slice(0, 12)}</span>,
        },
        {
          key: 'createdAt',
          header: 'When',
          render: (r: GodOrgDetailPage['recentOrgActivity'][number]) => <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{r.createdAt ? relTime(r.createdAt) : '—'}</span>,
        },
      ]}
      data={recentOrgActivity}
      emptyLabel="No activity recorded"
      paginate={false}
    />
  );
}

// ── Platform Actions Tab ──────────────────────────────────────────────────

function PlatformActionsTab({ recentPlatformActions }: { recentPlatformActions: GodOrgDetailPage['recentPlatformActions'] }) {
  return (
    <DataTable
      columns={[
        {
          key: 'admin',
          header: 'Admin',
          render: (r: GodOrgDetailPage['recentPlatformActions'][number]) => <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{r.platformAdmin?.fullName ?? '—'}</span>,
        },
        {
          key: 'action',
          header: 'Action',
          render: (r: GodOrgDetailPage['recentPlatformActions'][number]) => <span className="font-mono" style={{ fontSize: 12, color: '#fbbf24' }}>{r.action}</span>,
        },
        {
          key: 'createdAt',
          header: 'When',
          render: (r: GodOrgDetailPage['recentPlatformActions'][number]) => <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{relTime(r.createdAt)}</span>,
        },
      ]}
      data={recentPlatformActions}
      emptyLabel="No audit entries"
      paginate={false}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

const TAB_IDS = ['overview', 'users', 'billing', 'activity', 'platform-actions'] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  users: 'Users',
  billing: 'Billing',
  activity: 'Activity',
  'platform-actions': 'Platform Actions',
};

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading, error, refetch } = useGodOrgDetailPage(orgId ?? null);
  const { suspendOrg, reactivateOrg, deleteOrg } = useOrganisations({ pageSize: 1 });
  useImpersonation(); // ensure hook is initialised; we call startImpersonation directly

  const [tab, setTab] = useState<TabId>('overview');
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (loading) {
    return (
      <div className="god-mode" style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
          <SkeletonCard lines={1} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
        </div>
        <SkeletonTable rows={8} cols={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="god-mode" style={{ padding: '24px 28px' }}>
        <ErrorBanner message={error ?? 'Organisation not found'} onRetry={refetch} />
      </div>
    );
  }

  const org = data.organisation;
  const users = data.users ?? [];
  const stats = data.stats as OrgStats | null;
  const isSuspended = !org.isActive && org.suspendedReason !== 'DELETED';
  const isDeleted = !org.isActive && org.suspendedReason === 'DELETED';

  const handleSuspend = async (reason: string) => {
    await suspendOrg(org.id, reason);
    toast.success(`${org.name} suspended`);
    void refetch();
  };

  const handleReactivate = async () => {
    try {
      await reactivateOrg(org.id);
      toast.success(`${org.name} reactivated`);
      void refetch();
    } catch (e) {
      toast.error(godErr(e, 'Failed to reactivate'));
    }
  };

  const handleDelete = async () => {
    await deleteOrg(org.id, org.slug);
    toast.success(`${org.name} deleted`);
    navigate('/god/organisations');
  };

  return (
    <div className="god-mode" style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <PageHeader
          title={org.name}
          breadcrumbs={[
            <span key="orgs" style={{ cursor: 'pointer', color: 'var(--accent-teal)' }} onClick={() => navigate('/god/organisations')}>Organisations</span>,
            org.name,
          ]}
          actions={
            <button
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => { void refetch(); }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          }
        />
      </div>

      {/* Header card */}
      <Card style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{org.name}</h2>
            <PlanBadge plan={org.plan} />
            <OrgStatusBadge org={org} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)', background: 'var(--bg-sunken)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
              {org.slug}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Created {shortDate(org.createdAt)}
            </span>
            {org.lastActivityAt && (
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                Last active {relTime(org.lastActivityAt)}
              </span>
            )}
          </div>
          {isSuspended && org.suspendedReason && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.35)', borderRadius: 6 }}>
              <UserX size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#fbbf24' }}>
                Suspended: <em>{org.suspendedReason}</em>
                {org.suspendedAt && ` · ${shortDate(org.suspendedAt)}`}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className="god-accent-btn"
            style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => setTab('overview')}
          >
            <DollarSign size={13} />
            Overview
          </button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as TabId)}>
        <Tabs.List style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20, gap: 0 }}>
          {TAB_IDS.map((tid) => (
            <Tabs.Trigger
              key={tid}
              value={tid}
              style={{ ...TAB_STYLE_BASE, color: tab === tid ? '#fbbf24' : 'var(--text-muted)', borderBottom: tab === tid ? '2px solid #d97706' : '2px solid transparent' }}
            >
              {TAB_LABELS[tid]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" forceMount style={{ display: tab === 'overview' ? undefined : 'none' }}>
          <OverviewTab
            orgId={org.id}
            orgName={org.name}
            orgSlug={org.slug}
            users={users}
            stats={stats}
            statsLoading={false}
            activityTimeline={data.activityTimeline ?? []}
            recentTrips={data.recentTrips ?? []}
            onSuspend={() => setSuspendOpen(true)}
            onReactivate={() => void handleReactivate()}
            onDelete={() => setDeleteOpen(true)}
            isSuspended={isSuspended}
            isDeleted={isDeleted}
          />
        </Tabs.Content>

        <Tabs.Content value="users" forceMount style={{ display: tab === 'users' ? undefined : 'none' }}>
          <UsersTab orgId={org.id} orgName={org.name} orgSlug={org.slug} users={users} />
        </Tabs.Content>

        <Tabs.Content value="billing" forceMount style={{ display: tab === 'billing' ? undefined : 'none' }}>
          <BillingTab billing={org.billing ?? null} stats={stats} />
        </Tabs.Content>

        <Tabs.Content value="activity" forceMount style={{ display: tab === 'activity' ? undefined : 'none' }}>
          <ActivityTab recentOrgActivity={data.recentOrgActivity ?? []} />
        </Tabs.Content>

        <Tabs.Content value="platform-actions" forceMount style={{ display: tab === 'platform-actions' ? undefined : 'none' }}>
          <PlatformActionsTab recentPlatformActions={data.recentPlatformActions ?? []} />
        </Tabs.Content>
      </Tabs.Root>

      {/* Suspend / Delete modals */}
      <SuspendModal
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        orgName={org.name}
        onConfirm={handleSuspend}
      />
      <DeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        orgSlug={org.slug}
        orgName={org.name}
        onConfirm={handleDelete}
      />
    </div>
  );
}
