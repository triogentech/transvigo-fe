import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { errMessage } from '../api/client';
import { getVendorPerformancePage, type VendorPerformancePage as Report, type VendorPerformanceRow } from '../api/pages.api';
import { ErrorBanner } from '../components/states';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const StatCard: React.FC<any> = UI.StatCard;

const inr = (v: number): string => `₹${Number(v).toLocaleString('en-IN')}`;
const hm = (min: number): string => (min > 0 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : '—');

/** This month on Indian time, as YYYY-MM. */
function thisMonth(): string {
  const d = new Date(Date.now() + 330 * 60_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function shiftMonth(m: string, by: number): string {
  const [y, mo] = m.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, mo - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
const monthName = (m: string): string => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

/** fast / on time / delayed as one thin bar, so a vendor's mix reads at a glance. */
function Split({ r }: { r: VendorPerformanceRow }) {
  const judged = r.fast + r.onTime + r.delayed;
  if (!judged) return <span style={{ color: 'var(--text-dim)' }}>—</span>;
  const part = (n: number, color: string, label: string) => (n ? <span title={`${label}: ${n}`} style={{ width: `${(n / judged) * 100}%`, background: color }} /> : null);
  return (
    <span role="img" aria-label={`${r.fast} fast, ${r.onTime} on time, ${r.delayed} delayed`} style={{ display: 'flex', width: 120, height: 8, borderRadius: 99, overflow: 'hidden', background: 'var(--bg-sunken)' }}>
      {part(r.fast, 'var(--success)', 'Fast')}
      {part(r.onTime, 'var(--accent-teal)', 'On time')}
      {part(r.delayed, 'var(--danger)', 'Delayed')}
    </span>
  );
}

function downloadCsv(report: Report): void {
  const head = ['Vendor', 'Vendor code', 'Departed', 'Closed', 'Fast', 'On time', 'Delayed', 'Not judged', 'On time or faster %', 'Average delay (min)', 'Penalty'];
  const lines = [head, ...report.rows.map((r) => [r.vendorName, r.vendorCode ?? '', r.departed, r.closed, r.fast, r.onTime, r.delayed, r.notJudged, r.onTimePct ?? '', r.avgDelayMinutes, r.penaltyAmount])]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','));
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = `vendor-performance-${report.month}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function VendorPerformancePage() {
  const [month, setMonth] = useState(thisMonth());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const mine = ++latest.current; // only the newest month may fill the page
    setLoading(true);
    setError(null);
    try {
      const res = await getVendorPerformancePage(month);
      if (mine === latest.current) setReport(res);
    } catch (e) {
      if (mine === latest.current) setError(errMessage(e));
    } finally {
      if (mine === latest.current) setLoading(false);
    }
  }, [month]);
  useEffect(() => { void load(); }, [load]);

  const t = report?.totals;
  const noVendor = report?.rows.find((r) => r.vendorId === null);
  const mono = (v: React.ReactNode) => <span className="font-mono">{v}</span>;

  const columns = [
    { key: 'vendor', header: 'Vendor', render: (r: VendorPerformanceRow) => (
      <span><span style={{ fontWeight: 500, color: r.vendorId ? 'var(--text-primary)' : 'var(--text-muted)' }}>{r.vendorName}</span>{r.vendorCode ? <span className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 11 }}> · {r.vendorCode}</span> : null}</span>
    ) },
    { key: 'departed', header: 'Departed', align: 'right', render: (r: VendorPerformanceRow) => mono(r.departed) },
    { key: 'closed', header: 'Closed', align: 'right', render: (r: VendorPerformanceRow) => <span className="font-mono" style={{ fontWeight: 600 }}>{r.closed}</span> },
    { key: 'fast', header: 'Fast', align: 'right', render: (r: VendorPerformanceRow) => <span className="font-mono" style={{ color: r.fast ? 'var(--success)' : 'var(--text-dim)' }}>{r.fast}</span> },
    { key: 'onTime', header: 'On time', align: 'right', render: (r: VendorPerformanceRow) => mono(r.onTime) },
    { key: 'delayed', header: 'Delayed', align: 'right', render: (r: VendorPerformanceRow) => <span className="font-mono" style={{ color: r.delayed ? 'var(--danger)' : 'var(--text-dim)', fontWeight: r.delayed ? 600 : 400 }}>{r.delayed}</span> },
    { key: 'split', header: 'Mix', render: (r: VendorPerformanceRow) => <Split r={r} /> },
    { key: 'pct', header: 'On time or faster', align: 'right', render: (r: VendorPerformanceRow) => (r.onTimePct === null ? '—' : <span className="font-mono" style={{ fontWeight: 600 }}>{r.onTimePct}%</span>) },
    { key: 'avg', header: 'Avg delay', align: 'right', render: (r: VendorPerformanceRow) => mono(hm(r.avgDelayMinutes)) },
    { key: 'penalty', header: 'Penalty', align: 'right', render: (r: VendorPerformanceRow) => mono(r.penaltyAmount ? inr(r.penaltyAmount) : '—') },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Vendor Performance"
        breadcrumbs={['Operations', 'Vendor Performance']}
        actions={
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost p-2" aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}><ChevronLeft size={16} /></button>
            <input className="tv-input" style={{ width: 170 }} type="month" aria-label="Month" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} />
            <button type="button" className="btn-ghost p-2" aria-label="Next month" disabled={month >= thisMonth()} onClick={() => setMonth((m) => shiftMonth(m, 1))}><ChevronRight size={16} /></button>
            <button type="button" className="btn-ghost px-3 py-1.5 flex items-center gap-2" style={{ fontSize: 13 }} disabled={!report || report.rows.length === 0} onClick={() => report && downloadCsv(report)}><Download size={14} /> CSV</button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-4 gap-4">
        <StatCard title={`Departed in ${monthName(month)}`} accent="var(--teal)"><span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{t?.departed ?? 0}</span></StatCard>
        <StatCard title="Closed" accent="var(--text-primary)">
          <span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{t?.closed ?? 0}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{t?.fast ?? 0} fast · {t?.onTime ?? 0} on time · {t?.delayed ?? 0} delayed</span>
        </StatCard>
        <StatCard title="On time or faster" accent="var(--success)"><span className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>{t?.onTimePct == null ? '—' : `${t.onTimePct}%`}</span></StatCard>
        <StatCard title="Average delay" accent="var(--danger)">
          <span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{hm(t?.avgDelayMinutes ?? 0)}</span>
          {t?.penaltyAmount ? <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{inr(t.penaltyAmount)} penalty</span> : null}
        </StatCard>
      </div>

      {report && noVendor && t && t.closed > 0 && noVendor.closed / t.closed >= 0.3 && (
        <div className="tv-card-flat" style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
          {noVendor.closed} of {t.closed} closed trips have no vendor on them, so they are listed under “{noVendor.vendorName}”. Add the vendor on those trips to count them for a vendor.
        </div>
      )}

      <DataTable columns={columns} data={report?.rows ?? []} loading={loading} emptyLabel={`No trips departed or closed in ${monthName(month)}.`} paginate={false} />

      <div style={{ fontSize: 12, color: 'var(--text-dim)', maxWidth: 760 }}>
        How a closed trip is judged: time taken = closing time − dispatch time (planned start when there is no dispatch time) − halt at touching points, against its TAT.
        Fast = {Math.round((report?.fastMarginMinutes ?? 60) / 60)}h or more under the TAT, On time = within the TAT, Delayed = over the TAT.
        {t && t.notJudged > 0 ? ` ${t.notJudged} closed ${t.notJudged === 1 ? 'trip has' : 'trips have'} no TAT or closing time and ${t.notJudged === 1 ? 'is' : 'are'} not judged.` : ''}
        {' '}Months run on Indian time.
      </div>
    </div>
  );
}
