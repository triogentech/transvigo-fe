import React, { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getAnalyticsPage, type AnalyticsPage } from '../api/pages.api';
import { errMessage } from '../api/client';
import { ErrorBanner } from '../components/states';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const StatCard: React.FC<any> = UI.StatCard;
const DataTable: React.FC<any> = UI.DataTable;

const inr = (v: number): string => `₹${Math.round(v).toLocaleString('en-IN')}`;
const inrK = (v: number): string => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${Math.round(v)}`);

const COST_KEYS = [
  { key: 'fuel', label: 'Fuel', color: '#2563EB' },
  { key: 'toll', label: 'Toll', color: '#0EA5C5' },
  { key: 'job', label: 'Maintenance', color: '#D97706' },
  { key: 'invoice', label: 'Invoices', color: '#7C3AED' },
] as const;

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getAnalyticsPage();
        if (active) setData(res);
      } catch (e) {
        if (active) setError(errMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const fleet = data?.fleet;
  const tcoData = (data?.perVehicle ?? []).slice(0, 10).map((v) => ({
    name: v.vehicleNumber, fuel: v.fuel, toll: v.toll, job: v.job, invoice: v.invoice,
  }));

  const vehicleBrandCols = [
    { key: 'brand', header: 'Make' },
    { key: 'count', header: 'Vehicles' },
    { key: 'breakdowns', header: 'Tickets', render: (r: { breakdowns: number }) => r.breakdowns },
    { key: 'totalCost', header: 'Total Cost', render: (r: { totalCost: number }) => inr(r.totalCost) },
    { key: 'avgCost', header: 'Avg / Vehicle', render: (r: { avgCost: number }) => inr(r.avgCost) },
  ];
  const tyreBrandCols = [
    { key: 'brand', header: 'Tyre Brand' },
    { key: 'totalTyres', header: 'Tyres' },
    { key: 'avgKmPerTyre', header: 'Avg KM', render: (r: { avgKmPerTyre: number }) => r.avgKmPerTyre.toLocaleString('en-IN') },
    { key: 'costPer1000km', header: 'Cost / 1000km', render: (r: { costPer1000km: number }) => inr(r.costPer1000km) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Fleet Analytics" breadcrumbs={['Operations', 'Analytics']} />

      {error && <ErrorBanner message={error} onRetry={() => location.reload()} />}

      <div className="grid grid-cols-5 gap-4">
        <StatCard title="Total TCO" accent="var(--accent-navy)"><span className="font-display" style={{ fontSize: 24, fontWeight: 700 }}>{fleet ? inr(fleet.total) : '—'}</span></StatCard>
        <StatCard title="Fuel" accent="#2563EB"><span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{fleet ? inr(fleet.fuel) : '—'}</span></StatCard>
        <StatCard title="Toll" accent="#0EA5C5"><span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{fleet ? inr(fleet.toll) : '—'}</span></StatCard>
        <StatCard title="Maintenance + Invoices" accent="#D97706"><span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{fleet ? inr(fleet.job + fleet.invoice) : '—'}</span></StatCard>
        <StatCard title="Tyres" accent="#7C3AED"><span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{fleet ? inr(fleet.tyre) : '—'}</span></StatCard>
      </div>

      {/* Per-vehicle TCO */}
      <div className="tv-card" style={{ padding: 16 }}>
        <div className="font-display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Cost per Vehicle (top 10)</div>
        {loading ? (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : tcoData.length === 0 ? (
          <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>No cost data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={tcoData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tickFormatter={inrK} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {COST_KEYS.map((c) => (
                <Bar key={c.key} dataKey={c.key} name={c.label} stackId="tco" fill={c.color} radius={[0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Vehicle brand benchmark */}
        <div className="tv-card" style={{ padding: 16 }}>
          <div className="font-display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Manufacturer Benchmark</div>
          <DataTable columns={vehicleBrandCols} data={data?.vehicleBrands ?? []} loading={loading} emptyLabel="No data" pageSize={6} />
        </div>
        {/* Tyre brand benchmark */}
        <div className="tv-card" style={{ padding: 16 }}>
          <div className="font-display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Tyre Brand CPK</div>
          <DataTable columns={tyreBrandCols} data={data?.tyreBrands ?? []} loading={loading} emptyLabel="No tyre data" pageSize={6} />
        </div>
      </div>

      {/* Brand cost bar */}
      {!loading && (data?.vehicleBrands?.length ?? 0) > 0 && (
        <div className="tv-card" style={{ padding: 16 }}>
          <div className="font-display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Avg Cost per Vehicle by Make</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.vehicleBrands ?? []} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="brand" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tickFormatter={inrK} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="avgCost" name="Avg Cost / Vehicle" radius={[4, 4, 0, 0]}>
                {(data?.vehicleBrands ?? []).map((_, i) => (
                  <Cell key={i} fill={['#1B2D6B', '#0EA5C5', '#D97706', '#7C3AED', '#16A34A', '#DC2626'][i % 6]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
