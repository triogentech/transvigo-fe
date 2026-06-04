// API CALLS: 1
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Building2, Users, Car, BarChart2, ShieldCheck, Pause } from 'lucide-react';
import { useGodDashboard } from '../../hooks/pages/god/useGodDashboard';
import { useImpersonation } from '../../hooks/god/useImpersonation';
import { SkeletonCard, ErrorBanner, LoadingButton } from '../../components/states';
import { PlanBadge } from '../../components/god/PlanBadge';
import { useToast } from '../../context/ToastContext';
import { relTime } from '../../lib/utils.js';

// ── Action colour helper ────────────────────────────────────────────────
function auditActionColor(action: string): string {
  if (action.includes('CREATED')) return '#4ade80';
  if (action.includes('SUSPENDED') || action.includes('STARTED')) return '#fbbf24';
  if (action.includes('DELETED')) return '#f87171';
  return '#9ca3af';
}

// ── KPI card ────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  dot?: 'green' | 'amber';
}
function KpiCard({ label, value, icon, dot }: KpiProps) {
  return (
    <div
      className="tv-card"
      style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ color: 'var(--text-tertiary)' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {dot && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: dot === 'green' ? '#4ade80' : '#fbbf24',
              flexShrink: 0,
            }}
          />
        )}
        <span
          className="font-mono"
          style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// ── Section heading ─────────────────────────────────────────────────────
function SectionHead({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid var(--border)',
      }}
    >
      {title}
    </div>
  );
}

// ── Donut legend label ───────────────────────────────────────────────────
function DonutLegendItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
      <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{count}</span>
    </div>
  );
}

export default function GodDashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading, error, refetch } = useGodDashboard();
  const { end: endSession } = useImpersonation();

  // Plan donut — planDistribution is [{plan, count}]
  const PLAN_COLORS: Record<string, string> = {
    starter: '#6b7280',
    pro: '#d97706',
    enterprise: '#facc15',
  };
  const planDonut = (data?.planDistribution ?? []).map((p) => ({
    name: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
    value: p.count,
    color: PLAN_COLORS[p.plan] ?? '#6b7280',
  }));

  // Convenience lookups for donut legend counts
  const planCountFor = (plan: string) =>
    data?.planDistribution.find((p) => p.plan === plan)?.count ?? 0;

  const handleEndSession = async (sessionId: string) => {
    try {
      await endSession(sessionId);
      toast.success('Impersonation session ended');
      refetch();
    } catch {
      toast.error('Failed to end session');
    }
  };

  return (
    <div className="god-mode" style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1
          className="font-display"
          style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}
        >
          Platform Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Real-time overview of all organisations and activity.
        </p>
      </div>

      {/* Top-level error */}
      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* ── KPI GRID ──────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
        </div>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          <KpiCard label="Total Organisations" value={data.stats.totalOrgs} icon={<Building2 size={16} />} />
          <KpiCard label="Active Orgs" value={data.stats.activeOrgs} icon={<Building2 size={16} />} dot="green" />
          <KpiCard
            label="Suspended Orgs"
            value={data.stats.suspendedOrgs}
            icon={<Pause size={16} />}
            dot={data.stats.suspendedOrgs > 0 ? 'amber' : undefined}
          />
          <KpiCard label="Total Users" value={data.stats.totalUsers} icon={<Users size={16} />} />
          <KpiCard label="Trips This Month" value={data.stats.tripsThisMonth} icon={<Car size={16} />} />
          <KpiCard label="Platform Admins" value={data.stats.platformAdminCount} icon={<ShieldCheck size={16} />} />
        </div>
      ) : null}

      {/* ── CHARTS ROW ────────────────────────────────────────────── */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 28 }}>
          {/* Plan Donut */}
          <div className="tv-card" style={{ padding: 20 }}>
            <SectionHead title="Plan Distribution" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={planDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={34}
                    outerRadius={52}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {planDonut.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartTooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: 12 }}
                    itemStyle={{ color: '#e5e5e5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <DonutLegendItem color="#6b7280" label="Starter" count={planCountFor('starter')} />
                <DonutLegendItem color="#d97706" label="Pro" count={planCountFor('pro')} />
                <DonutLegendItem color="#facc15" label="Enterprise" count={planCountFor('enterprise')} />
              </div>
            </div>
          </div>

          {/* Org Growth Area */}
          <div className="tv-card" style={{ padding: 20 }}>
            <SectionHead title="Organisation Growth" />
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={data.orgGrowth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orgGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartTooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', fontSize: 12 }}
                  itemStyle={{ color: '#d97706' }}
                />
                <Area
                  type="monotone"
                  dataKey="newOrgs"
                  stroke="#d97706"
                  strokeWidth={2}
                  fill="url(#orgGrowthGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── BOTTOM GRID: Top Orgs + Recent Actions ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        {/* Most Active Orgs */}
        <div className="tv-card" style={{ padding: 20 }}>
          <SectionHead title="Top 5 Active Organisations" />
          {loading ? (
            <SkeletonCard lines={5} />
          ) : (data?.mostActiveOrgs ?? []).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>No data yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', color: 'var(--text-dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 8, borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Org</th>
                  <th style={{ textAlign: 'left', color: 'var(--text-dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 8, borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Plan</th>
                  <th style={{ textAlign: 'right', color: 'var(--text-dim)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 8, borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Trips MTD</th>
                </tr>
              </thead>
              <tbody>
                {(data?.mostActiveOrgs ?? []).slice(0, 5).map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/god/organisations/${o.id}`)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{o.name}</td>
                    <td style={{ padding: '8px 0' }}><PlanBadge plan={o.plan} /></td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }} className="font-mono">{o.tripsThisMonth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Platform Actions */}
        <div className="tv-card" style={{ padding: 20 }}>
          <SectionHead title="Recent Platform Actions" />
          {loading ? (
            <SkeletonCard lines={5} />
          ) : (data?.recentPlatformActions ?? []).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>No recent actions.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(data?.recentPlatformActions ?? []).slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: '#9ca3af', minWidth: 90, flexShrink: 0 }}>
                    {log.platformAdmin?.fullName ?? '—'}
                  </span>
                  <span
                    style={{
                      color: auditActionColor(log.action),
                      fontWeight: 600,
                      fontSize: 11,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {log.action}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>
                    {log.targetType}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10, flexShrink: 0 }}>
                    {relTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ACTIVE IMPERSONATION PANEL ────────────────────────────── */}
      <div className="tv-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionHead title={`Active Impersonation Sessions (${(data?.activeImpersonations ?? []).length})`} />
          <BarChart2 size={15} style={{ color: '#d97706', marginBottom: 12 }} />
        </div>
        {loading ? (
          <SkeletonCard lines={2} />
        ) : (data?.activeImpersonations ?? []).length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0' }}>No active impersonation sessions.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data?.activeImpersonations ?? []).map((s) => (
              <div
                key={s.sessionId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'rgba(217,119,6,0.06)',
                  border: '1px solid rgba(217,119,6,0.25)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <span style={{ color: '#d97706', fontWeight: 600 }}>
                  {s.platformAdmin?.fullName ?? '—'}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                  {s.targetOrg?.name ?? '—'}
                  {s.targetUser && (
                    <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>
                      / {s.targetUser.username}
                    </span>
                  )}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: 11, flexShrink: 0 }}>
                  {relTime(s.startedAt)}
                </span>
                <LoadingButton
                  className="god-accent-btn"
                  style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => void handleEndSession(s.sessionId)}
                >
                  End Session
                </LoadingButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
