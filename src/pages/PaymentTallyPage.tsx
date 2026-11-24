import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { getSelect, type SelectOption } from '../api/select.api';
import { getTripBills, updateTripBill, type TripBillFilters } from '../api/trip-bills.api';
import type { TripBill, TripBillStatus, TripBillSummary } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';
import { SearchInput } from '../components/SearchInput';
import { usePermissions } from '../context/PermissionsContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const Pill: React.FC<any> = UI.Pill;
const StatCard: React.FC<any> = UI.StatCard;

const inr = (v: number): string => `₹${Number(v).toLocaleString('en-IN')}`;
const day = (v: string | null): string => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const isoDay = (v: string | null): string => (v ? new Date(v).toISOString().slice(0, 10) : '');

const STATUS_META: Record<TripBillStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'var(--danger)' },
  partial: { label: 'Part paid', color: 'var(--warning)' },
  paid: { label: 'Paid', color: 'var(--success)' },
};

interface EditForm {
  invoiceNumber: string; penaltyAmount: string; penaltyRemark: string; transferDate: string;
  rentPaidAmount: string; gstTransferDate: string; tdsApplicable: boolean; gstApplicable: boolean;
}

/** Payment Tally: the bill raised to a company when each trip completes, what it owes and what it has paid. */
export default function PaymentTallyPage() {
  const toast = useToast();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('trip-bills', 'canUpdate');
  const [rows, setRows] = useState<TripBill[]>([]);
  const [summary, setSummary] = useState<TripBillSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TripBillFilters>({});
  const [companies, setCompanies] = useState<SelectOption[]>([]);
  const [edit, setEdit] = useState<TripBill | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTripBills(filters);
      setRows(res.data);
      setSummary(res.summary);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void getSelect('vendors', { status: 'load_provider' }).then(setCompanies).catch(() => undefined); }, []);

  const openEdit = (b: TripBill) => {
    setEdit(b);
    setForm({
      invoiceNumber: b.invoiceNumber, penaltyAmount: String(b.penaltyAmount), penaltyRemark: b.penaltyRemark ?? '',
      transferDate: isoDay(b.transferDate), rentPaidAmount: String(b.rentPaidAmount), gstTransferDate: isoDay(b.gstTransferDate),
      tdsApplicable: b.tdsApplicable, gstApplicable: b.gstApplicable,
    });
  };

  const save = async () => {
    if (!edit || !form) return;
    if (!form.invoiceNumber.trim()) return toast.error('Enter the invoice number');
    setSaving(true);
    try {
      await updateTripBill(edit.id, {
        invoiceNumber: form.invoiceNumber.trim(),
        penaltyAmount: Number(form.penaltyAmount) || 0,
        penaltyRemark: form.penaltyRemark.trim() || null,
        transferDate: form.transferDate || null,
        rentPaidAmount: Number(form.rentPaidAmount) || 0,
        gstTransferDate: form.gstTransferDate || null,
        tdsApplicable: form.tdsApplicable,
        gstApplicable: form.gstApplicable,
      });
      toast.success(`Bill ${form.invoiceNumber.trim()} updated`);
      setEdit(null);
      await load();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const mono = (v: React.ReactNode) => <span className="font-mono">{v}</span>;
  const columns = [
    { key: 'invoiceNumber', header: 'Invoice No', render: (r: TripBill) => <span className="font-mono" style={{ color: 'var(--teal)' }}>{r.invoiceNumber}</span> },
    { key: 'tripNumber', header: 'Trip No', render: (r: TripBill) => mono(r.tripNumber) },
    { key: 'tripStartDate', header: 'Trip Start', render: (r: TripBill) => day(r.tripStartDate) },
    { key: 'tripCloseDate', header: 'Trip Close', render: (r: TripBill) => day(r.tripCloseDate) },
    { key: 'route', header: 'Route' },
    { key: 'vehicleNumber', header: 'Vehicle', render: (r: TripBill) => r.vehicleNumber ?? '—' },
    { key: 'vendorName', header: 'Vendor', render: (r: TripBill) => r.vendorName ?? '—' },
    { key: 'vendorCode', header: 'Vendor Code', render: (r: TripBill) => mono(r.vendorCode ?? '—') },
    { key: 'tds', header: 'TDS', render: (r: TripBill) => (r.tdsApplicable ? <Pill color="var(--accent-teal)">Yes</Pill> : <span style={{ color: 'var(--text-muted)' }}>No</span>) },
    { key: 'freight', header: 'Freight', render: (r: TripBill) => mono(inr(r.freight)) },
    { key: 'advance', header: 'Advance', render: (r: TripBill) => mono(inr(r.advance)) },
    { key: 'balance', header: 'Balance', render: (r: TripBill) => mono(inr(r.balance)) },
    { key: 'tdsAmount', header: 'TDS 1%', render: (r: TripBill) => mono(r.tdsApplicable ? `− ${inr(r.tdsAmount)}` : '—') },
    { key: 'gstAmount', header: 'GST', render: (r: TripBill) => (r.gstApplicable ? mono(`+ ${inr(r.gstAmount)} (${r.gstRate}%)`) : '—') },
    { key: 'penalty', header: 'Penalty', render: (r: TripBill) => (r.penaltyAmount ? <span title={r.penaltyRemark ?? ''}>{mono(`− ${inr(r.penaltyAmount)}`)}{r.penaltyRemark ? <span style={{ color: 'var(--text-dim)', fontSize: 11 }}> · {r.penaltyRemark.length > 24 ? `${r.penaltyRemark.slice(0, 24)}…` : r.penaltyRemark}</span> : null}</span> : '—') },
    { key: 'totalToPay', header: 'Total to pay', render: (r: TripBill) => <span className="font-mono" style={{ fontWeight: 600 }}>{inr(r.totalToPay)}</span> },
    { key: 'transferDate', header: 'Transfer Date', render: (r: TripBill) => day(r.transferDate) },
    { key: 'rentPaidAmount', header: 'Rent Payment', render: (r: TripBill) => mono(inr(r.rentPaidAmount)) },
    { key: 'gstTransferDate', header: 'GST Transfer Date', render: (r: TripBill) => day(r.gstTransferDate) },
    { key: 'amountRemaining', header: 'Remaining', render: (r: TripBill) => <span className="font-mono" style={{ color: r.amountRemaining ? 'var(--danger)' : 'var(--success)' }}>{inr(r.amountRemaining)}</span> },
    { key: 'status', header: 'Status', render: (r: TripBill) => <Pill color={STATUS_META[r.status].color}>{STATUS_META[r.status].label}</Pill> },
    {
      key: 'actions', header: '',
      render: (r: TripBill) => (canEdit ? <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Update</button> : null),
    },
  ];

  const set = <K extends keyof EditForm>(k: K, v: EditForm[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  // live preview of the tally while editing
  const preview = edit && form ? (() => {
    const tds = form.tdsApplicable ? Math.round(edit.freight * 0.01) : 0;
    const gst = form.gstApplicable ? Math.round((edit.freight * edit.gstRate) / 100) : 0;
    const total = Math.max(0, edit.balance - tds - (Number(form.penaltyAmount) || 0) + gst);
    return { tds, gst, total, remaining: Math.max(0, total - (Number(form.rentPaidAmount) || 0)) };
  })() : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Payment Tally" breadcrumbs={['Finance', 'Payment Tally']} />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total billed" accent="var(--teal)"><span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{inr(summary?.totalBilled ?? 0)}</span></StatCard>
        <StatCard title="Received" accent="var(--success)"><span className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>{inr(summary?.totalReceived ?? 0)}</span></StatCard>
        <StatCard title="Remaining to receive" accent="var(--danger)"><span className="font-display" style={{ fontSize: 22, fontWeight: 700, color: (summary?.totalRemaining ?? 0) > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{inr(summary?.totalRemaining ?? 0)}</span></StatCard>
        <StatCard title="Bills" accent="var(--text-primary)">
          <span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{summary?.bills ?? 0}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{summary?.pending ?? 0} pending · {summary?.partial ?? 0} part · {summary?.paid ?? 0} paid</span>
        </StatCard>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <SearchInput value={filters.search ?? ''} onChange={(v: string) => setFilters((f) => ({ ...f, search: v || undefined }))} placeholder="Search invoice, trip, vehicle or vendor…" />
        <select className="tv-input" style={{ width: 220 }} value={filters.loadProviderId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, loadProviderId: e.target.value || undefined }))}>
          <option value="">All vendors</option>
          {companies.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
        </select>
        <select className="tv-input" style={{ width: 160 }} value={filters.status ?? ''} onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as TripBillStatus | undefined }))}>
          <option value="">All payments</option>
          <option value="pending">Pending</option>
          <option value="partial">Part paid</option>
          <option value="paid">Paid</option>
        </select>
        <label className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Trip closed
          <input className="tv-input" style={{ width: 150 }} type="date" value={filters.dateFrom ?? ''} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))} />
          <span>to</span>
          <input className="tv-input" style={{ width: 150 }} type="date" value={filters.dateTo ?? ''} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))} />
        </label>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 2450 }}>
        <DataTable columns={columns} data={rows} loading={loading} emptyLabel="No bills yet. A bill is raised automatically when a trip is completed." pageSize={12} />
        </div>
      </div>

      <Modal
        open={!!edit}
        onOpenChange={(o: boolean) => { if (!o) setEdit(null); }}
        title={edit ? `Bill ${edit.invoiceNumber}` : 'Bill'}
        footer={canEdit ? <LoadingButton className="btn-brand" loading={saving} onClick={save}>Save</LoadingButton> : undefined}
      >
        {edit && form && preview && (
          <div className="flex flex-col gap-3">
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {edit.tripNumber} · {edit.route} · {edit.vendorName ?? 'No vendor'} {edit.vendorCode ? `(${edit.vendorCode})` : ''} · {edit.vehicleNumber ?? '—'}
            </div>
            <div className="tv-card-flat" style={{ padding: 12, fontSize: 13, display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 4 }}>
              <span>Freight</span><span className="font-mono">{inr(edit.freight)}</span>
              <span>Advance</span><span className="font-mono">− {inr(edit.advance)}</span>
              <span>Balance</span><span className="font-mono">{inr(edit.balance)}</span>
              <span>TDS 1% on freight</span><span className="font-mono">− {inr(preview.tds)}</span>
              <span>Penalty</span><span className="font-mono">− {inr(Number(form.penaltyAmount) || 0)}</span>
              <span>GST {edit.gstRate}% on freight</span><span className="font-mono">+ {inr(preview.gst)}</span>
              <span style={{ fontWeight: 600 }}>Total to pay</span><span className="font-mono" style={{ fontWeight: 600 }}>{inr(preview.total)}</span>
              <span>Received</span><span className="font-mono">− {inr(Number(form.rentPaidAmount) || 0)}</span>
              <span style={{ fontWeight: 600, color: preview.remaining ? 'var(--danger)' : 'var(--success)' }}>Remaining</span>
              <span className="font-mono" style={{ fontWeight: 600, color: preview.remaining ? 'var(--danger)' : 'var(--success)' }}>{inr(preview.remaining)}</span>
            </div>
            <Field label="Invoice number"><input className="tv-input w-full font-mono" value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} /></Field>
            <div className="flex gap-3">
              <Field label="Transfer date"><input className="tv-input w-full" type="date" value={form.transferDate} onChange={(e) => set('transferDate', e.target.value)} /></Field>
              <Field label="Rent payment received (₹)"><input className="tv-input w-full" type="number" min="0" value={form.rentPaidAmount} onChange={(e) => set('rentPaidAmount', e.target.value)} /></Field>
            </div>
            <Field label="GST transfer date"><input className="tv-input w-full" type="date" value={form.gstTransferDate} onChange={(e) => set('gstTransferDate', e.target.value)} /></Field>
            <div className="flex gap-3">
              <Field label="Penalty (₹)"><input className="tv-input w-full" type="number" min="0" value={form.penaltyAmount} onChange={(e) => set('penaltyAmount', e.target.value)} /></Field>
              <Field label="Penalty remark"><input className="tv-input w-full" value={form.penaltyRemark} onChange={(e) => set('penaltyRemark', e.target.value)} placeholder="e.g. late delivery" /></Field>
            </div>
            <div className="flex gap-4 items-center" style={{ fontSize: 13 }}>
              <label><input type="checkbox" checked={form.tdsApplicable} onChange={(e) => set('tdsApplicable', e.target.checked)} /> TDS applies</label>
              <label><input type="checkbox" checked={form.gstApplicable} onChange={(e) => set('gstApplicable', e.target.checked)} /> GST applies ({edit.gstRate}%)</label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}
