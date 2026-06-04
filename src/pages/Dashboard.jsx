// ── SECTION: Dashboard Page ──
// Operations overview: stat cards, fleet strip, charts, recent trips, compliance alerts.

import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
  XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts';
import { AlertCircle, IndianRupee, Route, TrendingDown, TrendingUp, Truck } from 'lucide-react';

import {
  AnimatedNumber, Card, DataTable, PageHeader, StatCard,
  StatusBadge,
} from '../components/ui.jsx';
import { SkeletonCard, SkeletonTable, ErrorBanner } from '../components/states.tsx';
import { useDashboardPage } from '../hooks/useDashboardPage';
import { formatINR } from '../lib/utils.js';
// useRole removed — Layout no longer exports role-switcher context

// ─────────────────────────────────────────────
// Expense donut color map
// ─────────────────────────────────────────────
const EXPENSE_COLORS = {
  fuel:            '#0EA5C5',
  driver_advance:  '#4A9B3C',
  extra_advance:   '#6366F1',
  incentives:      '#F59E0B',
  food:            '#EC4899',
  challan:         '#EF4444',
  maintenance:     '#8B5CF6',
};

// ─────────────────────────────────────────────
// Pie chart custom legend
// ─────────────────────────────────────────────
function DonutLegend({ data }) {
  return (
    <div className="flex flex-col justify-center gap-1.5 ml-4" style={{ minWidth: 120 }}>
      {data.map((d) => (
        <div key={d.txnTowards} className="flex items-center gap-1.5">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0, display: 'inline-block' }} />
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {d.txnTowards.replace('_', ' ')}
          </span>
          <span className="font-mono ml-auto" style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
            {formatINR(d.total)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// X-axis tick formatter: "DD MMM" short
// ─────────────────────────────────────────────
function shortDayMonth(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// ─────────────────────────────────────────────
// Recent trips table columns
// ─────────────────────────────────────────────
const TRIP_COLUMNS = [
  {
    key: 'tripNumber',
    header: 'Trip #',
    render: (row) => (
      <span className="font-mono" style={{ color: 'var(--teal)', fontSize: 12.5 }}>{row.tripNumber}</span>
    ),
  },
  {
    key: 'route',
    header: 'Route',
    render: (row) => (
      <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
        {row.startPoint} → {row.endPoint}
      </span>
    ),
  },
  {
    key: 'driver',
    header: 'Driver',
    render: (row) => (
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        {row.driver?.fullName ?? '—'}
      </span>
    ),
  },
  {
    key: 'vehicle',
    header: 'Vehicle',
    render: (row) => (
      <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
        {row.vehicle?.vehicleNumber ?? '—'}
      </span>
    ),
  },
  {
    key: 'currentStatus',
    header: 'Status',
    render: (row) => <StatusBadge status={row.currentStatus} />,
  },
  {
    key: 'freightTotalAmount',
    header: 'Freight',
    render: (row) => (
      <span className="font-mono" style={{ color: 'var(--text-primary)', fontSize: 12.5 }}>
        {formatINR(row.freightTotalAmount)}
      </span>
    ),
  },
];

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────
export default function Dashboard() {
  const { data, loading, error, refetch } = useDashboardPage();

  // Fleet strip selection
  const [selectedSegment, setSelectedSegment] = useState(null);

  // Enrich expense breakdown with color
  const enrichedExpenses = useMemo(
    () => (data?.expenseBreakdown ?? []).map((e) => ({ ...e, color: EXPENSE_COLORS[e.txnTowards] ?? '#6B7280' })),
    [data],
  );

  // Fleet segment counts from data.fleetStatus
  const fleetStatus = data?.fleetStatus ?? { idle: 0, assigned: 0, inTransit: 0 };
  const FLEET_SEGMENTS = [
    { key: 'inTransit', label: 'In Transit', color: 'var(--teal)',       count: fleetStatus.inTransit },
    { key: 'assigned',  label: 'Assigned',   color: 'var(--green)',      count: fleetStatus.assigned  },
    { key: 'idle',      label: 'Idle',       color: 'var(--navy-light)', count: fleetStatus.idle      },
  ];

  const fleetBarTotal = (fleetStatus.inTransit + fleetStatus.assigned + fleetStatus.idle) || 1;

  // Revenue delta from server-computed revenueGrowthPct
  const revDelta = data?.stats?.revenueGrowthPct ?? null;

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col gap-5 animate-fadeIn">
        <PageHeader title="DASHBOARD" breadcrumbs={['Operations', 'Dashboard']} />
        <div className="grid grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col gap-5 animate-fadeIn">
        <PageHeader title="DASHBOARD" breadcrumbs={['Operations', 'Dashboard']} />
        <ErrorBanner message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">

      {/* 1. Page Header */}
      <PageHeader
        title="DASHBOARD"
        breadcrumbs={['Operations', 'Dashboard']}
        actions={
          <button className="btn-brand px-4 py-1.5 text-sm">
            + New Trip
          </button>
        }
      />

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-4 gap-4">

        {/* Active Trips */}
        <StatCard
          title="Active Trips"
          icon={Route}
          accent="var(--teal)"
          streak
          sub={`${data?.stats?.tripsCompletingToday ?? 0} completing today`}
        >
          <div className="flex items-center gap-2">
            <span
              className="animate-pulse-teal rounded-full"
              style={{ width: 10, height: 10, background: 'var(--teal)', display: 'inline-block', flexShrink: 0 }}
            />
            <AnimatedNumber
              value={data?.stats?.activeTrips ?? 0}
              className="font-mono font-bold"
              style={{ fontSize: 36, color: 'var(--teal)', lineHeight: 1 }}
            />
          </div>
        </StatCard>

        {/* Vehicles On Road */}
        <StatCard
          title="Vehicles On Road"
          icon={Truck}
          accent="var(--green)"
          sub={
            <div
              className="mt-1 rounded-full overflow-hidden"
              style={{ height: 5, background: 'var(--navy-light)' }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((data?.stats?.vehiclesOnRoad ?? 0) / ((data?.stats?.totalVehicles || 1))) * 100}%`,
                  background: 'var(--teal)',
                  borderRadius: 99,
                  transition: 'width 600ms ease',
                }}
              />
            </div>
          }
        >
          <span
            className="font-mono font-bold"
            style={{ fontSize: 32, color: 'var(--text-primary)', lineHeight: 1 }}
          >
            {data?.stats?.vehiclesOnRoad ?? 0} / {data?.stats?.totalVehicles ?? 0}
          </span>
        </StatCard>

        {/* Revenue MTD */}
        <StatCard
          title="Revenue MTD"
          icon={IndianRupee}
          accentGradient
          sub={
            revDelta !== null ? (
              <span className="flex items-center gap-1">
                {revDelta >= 0
                  ? <TrendingUp size={12} style={{ color: 'var(--success)' }} />
                  : <TrendingDown size={12} style={{ color: 'var(--danger)' }} />
                }
                <span style={{ color: revDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {revDelta >= 0 ? '+' : ''}{revDelta.toFixed(1)}% vs last month
                </span>
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>No last month data</span>
            )
          }
        >
          <AnimatedNumber
            value={data?.stats?.revenueMtd ?? 0}
            format={formatINR}
            className="font-mono font-bold"
            style={{ fontSize: 30, color: 'var(--text-primary)', lineHeight: 1 }}
          />
        </StatCard>

        {/* Pending Advances */}
        <StatCard
          title="Pending Advances"
          icon={AlertCircle}
          accent="var(--warning)"
          sub={`${data?.stats?.pendingTripsCount ?? 0} trips awaiting settlement`}
        >
          <span
            className="font-mono font-bold"
            style={{ fontSize: 30, color: 'var(--warning)', lineHeight: 1 }}
          >
            {formatINR(data?.stats?.pendingAdvances ?? 0)}
          </span>
        </StatCard>

      </div>

      {/* 3. Fleet Status Strip */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span
            className="font-display font-bold uppercase"
            style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.06em' }}
          >
            Fleet Status
          </span>
          {selectedSegment && (
            <button
              className="btn-ghost px-2 py-0.5 text-xs"
              style={{ fontSize: 11 }}
              onClick={() => setSelectedSegment(null)}
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Segmented bar */}
        <div
          className="flex rounded overflow-hidden"
          style={{ height: 28, gap: 2 }}
        >
          {FLEET_SEGMENTS.map((seg) => (
            <button
              key={seg.key}
              onClick={() => setSelectedSegment(selectedSegment === seg.key ? null : seg.key)}
              style={{
                width: `${(seg.count / fleetBarTotal) * 100}%`,
                background: seg.color,
                opacity: selectedSegment && selectedSegment !== seg.key ? 0.3 : 1,
                transition: 'width 600ms ease, opacity 200ms ease',
                cursor: 'pointer',
                border: selectedSegment === seg.key ? '2px solid var(--text-primary)' : '2px solid transparent',
                borderRadius: 3,
                flexShrink: 0,
              }}
              title={`${seg.label}: ${seg.count}`}
            />
          ))}
        </div>

        {/* Labels row */}
        <div className="flex mt-2" style={{ gap: 2 }}>
          {FLEET_SEGMENTS.map((seg) => (
            <div
              key={seg.key}
              style={{ width: `${(seg.count / fleetBarTotal) * 100}%`, flexShrink: 0 }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: seg.color, display: 'inline-block', flexShrink: 0,
                  }}
                />
                <span
                  className="font-body"
                  style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
                >
                  {seg.label}
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ fontSize: 11, color: 'var(--text-primary)' }}
                >
                  {seg.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Charts row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Trip Activity (col-span-2) */}
        <Card className="p-4 col-span-2">
          <div
            className="font-display font-bold uppercase mb-3"
            style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.06em' }}
          >
            Trip Activity (30 days)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.tripActivity ?? []} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4A9B3C" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4A9B3C" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="gradStarted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0EA5C5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0EA5C5" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDayMonth}
                tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-body)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
              />
              <ReTooltip
                contentStyle={{
                  background: 'var(--navy-mid)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                }}
                labelStyle={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12 }}
                labelFormatter={shortDayMonth}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area
                type="monotone"
                dataKey="started"
                name="Started"
                stroke="#0EA5C5"
                strokeWidth={2}
                fill="url(#gradStarted)"
                dot={false}
                activeDot={{ r: 4, fill: '#0EA5C5', strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#4A9B3C"
                strokeWidth={2}
                fill="url(#gradCompleted)"
                dot={false}
                activeDot={{ r: 4, fill: '#4A9B3C', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {/* Manual legend */}
          <div className="flex items-center gap-4 mt-1" style={{ paddingLeft: 8 }}>
            {[
              { label: 'Started',   color: '#0EA5C5' },
              { label: 'Completed', color: '#4A9B3C' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span style={{ width: 12, height: 3, background: l.color, borderRadius: 2, display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Expense Breakdown donut */}
        <Card className="p-4 flex flex-col">
          <div
            className="font-display font-bold uppercase mb-3"
            style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.06em' }}
          >
            Expense Breakdown
          </div>
          <div className="flex items-center flex-1 min-h-0">
            {enrichedExpenses.length === 0 ? (
              <div className="flex items-center justify-center w-full" style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                No expenses this month
              </div>
            ) : (
              <>
                {/* Donut with SVG center label */}
                <div style={{ position: 'relative', width: 175, height: 175, flexShrink: 0 }}>
                  <ResponsiveContainer width={175} height={175}>
                    <PieChart>
                      <Pie
                        data={enrichedExpenses}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        dataKey="total"
                        startAngle={90}
                        endAngle={-270}
                        strokeWidth={0}
                        labelLine={false}
                      >
                        {enrichedExpenses.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <ReTooltip
                        contentStyle={{
                          background: 'var(--navy-mid)',
                          border: '1px solid var(--border)',
                          borderRadius: 4,
                          fontSize: 12,
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-body)',
                        }}
                        formatter={(value, name) => [formatINR(value), name]}
                        labelStyle={{ display: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label absolutely overlaid */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <span style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-body)', textAlign: 'center', lineHeight: 1.4 }}>
                      This<br />Month
                    </span>
                  </div>
                </div>
                <DonutLegend data={enrichedExpenses} />
              </>
            )}
          </div>
        </Card>

      </div>

      {/* 5. Recent Trips + Compliance Alerts */}
      <div className="grid grid-cols-3 gap-4">

        {/* Recent Trips (col-span-2) */}
        <Card className="p-0 overflow-hidden col-span-2">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span
              className="font-display font-bold uppercase"
              style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.06em' }}
            >
              Recent Trips
            </span>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {(data?.recentTrips ?? []).length} trips
            </span>
          </div>
          <DataTable
            columns={TRIP_COLUMNS}
            data={data?.recentTrips ?? []}
            paginate={false}
            emptyLabel="No trips found"
          />
        </Card>

        {/* Compliance Alerts */}
        <Card className="p-4 flex flex-col" style={{ minHeight: 0 }}>
          <span
            className="font-display font-bold uppercase mb-3"
            style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.06em' }}
          >
            Compliance Alerts
          </span>
          {(data?.complianceAlerts ?? []).length === 0 ? (
            <div className="flex items-center justify-center flex-1" style={{ color: 'var(--text-dim)', fontSize: 13 }}>
              All documents up to date
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: 340 }}>
              {(data?.complianceAlerts ?? []).slice(0, 8).map((alert, i) => {
                const isDanger = alert.daysLeft < 14;
                const color = isDanger ? 'var(--danger)' : 'var(--warning)';
                return (
                  <div
                    key={`${alert.vehicleId}-${alert.documentType}-${i}`}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded"
                    style={{ background: isDanger ? 'rgba(232,57,77,0.07)' : 'rgba(245,158,11,0.07)', border: `1px solid ${isDanger ? 'rgba(232,57,77,0.2)' : 'rgba(245,158,11,0.2)'}` }}
                  >
                    <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alert.vehicleNumber} · {alert.documentType}
                    </span>
                    <span className="font-mono font-bold flex-shrink-0" style={{ fontSize: 11.5, color }}>
                      {alert.daysLeft < 0 ? `${Math.abs(alert.daysLeft)}d overdue` : `${alert.daysLeft}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>

    </div>
  );
}
