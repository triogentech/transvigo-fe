import React, { useEffect, useMemo, useState } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import { getSelect, type SelectOption } from '../api/select.api';
import type { CreateInvoiceBody, InvoiceStatus, SupplierInvoice } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';
import { SearchInput } from '../components/SearchInput';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const Pill: React.FC<any> = UI.Pill;
const StatCard: React.FC<any> = UI.StatCard;

const inr = (v: string | number): string => `₹${Number(v).toLocaleString('en-IN')}`;
const num = (v: string | number): number => Number(v);

const STATUS_META: Record<InvoiceStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#D97706' },
  outstanding: { label: 'Outstanding', color: '#DC2626' },
  paid: { label: 'Paid', color: '#16A34A' },
};
const STATUSES: InvoiceStatus[] = ['pending', 'outstanding', 'paid'];

interface FormState { invoiceNumber: string; vehicleId: string; estimatedAmount: string; billedAmount: string; notes: string }
const EMPTY_FORM: FormState = { invoiceNumber: '', vehicleId: '', estimatedAmount: '', billedAmount: '', notes: '' };

export default function InvoicesPage() {
  const { allInvoices, loading, error, refetch, createInvoice, recordPayment } = useInvoices();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);

  useEffect(() => {
    void getSelect('vehicles').then(setVehicles).catch(() => undefined);
  }, []);

  const summary = useMemo(() => {
    const flagged = allInvoices.filter((i) => i.isFlagged).length;
    const outstanding = allInvoices
      .filter((i) => i.status !== 'paid')
      .reduce((s, i) => s + (num(i.billedAmount) - num(i.paidAmount)), 0);
    const billed = allInvoices.reduce((s, i) => s + num(i.billedAmount), 0);
    return { flagged, outstanding, billed, count: allInvoices.length };
  }, [allInvoices]);

  const rows = useMemo(
    () =>
      (allInvoices as SupplierInvoice[]).filter(
        (i) =>
          matchesSearch(i, ['refNumber', 'invoiceNumber'], search) &&
          (!flaggedOnly || i.isFlagged),
      ),
    [allInvoices, search, flaggedOnly],
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const previewVariance = useMemo(() => {
    const est = Number(form.estimatedAmount);
    const billed = Number(form.billedAmount);
    if (!est || est <= 0) return null;
    const pct = ((billed - est) / est) * 100;
    return { pct: Math.round(pct * 10) / 10, flagged: pct > 15 };
  }, [form.estimatedAmount, form.billedAmount]);

  const submit = async () => {
    if (!form.invoiceNumber.trim()) return toast.error('Enter the vendor invoice number');
    setSubmitting(true);
    try {
      const body: CreateInvoiceBody = {
        invoiceNumber: form.invoiceNumber.trim(),
        vehicleId: form.vehicleId || null,
        estimatedAmount: form.estimatedAmount ? Number(form.estimatedAmount) : 0,
        billedAmount: form.billedAmount ? Number(form.billedAmount) : 0,
        notes: form.notes.trim() || null,
      };
      const inv = await createInvoice(body);
      toast.success(`Invoice ${inv.refNumber} registered`);
      setForm(EMPTY_FORM);
      setOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onStatus = async (inv: SupplierInvoice, status: InvoiceStatus) => {
    try {
      await recordPayment(inv.id, status, status === 'paid' ? num(inv.billedAmount) : undefined);
      toast.success(`${inv.refNumber} → ${STATUS_META[status].label}`);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const columns = [
    { key: 'refNumber', header: 'REF', render: (r: SupplierInvoice) => <span className="font-mono" style={{ color: 'var(--teal)' }}>{r.refNumber}</span> },
    { key: 'invoiceNumber', header: 'Invoice #', render: (r: SupplierInvoice) => <span className="font-mono">{r.invoiceNumber}</span> },
    { key: 'vendor', header: 'Vendor', render: (r: SupplierInvoice) => r.vendor?.vendorName ?? '—' },
    { key: 'vehicle', header: 'Vehicle', render: (r: SupplierInvoice) => r.vehicle?.vehicleNumber ?? '—' },
    { key: 'estimatedAmount', header: 'Estimate', render: (r: SupplierInvoice) => inr(r.estimatedAmount) },
    { key: 'billedAmount', header: 'Billed', render: (r: SupplierInvoice) => inr(r.billedAmount) },
    {
      key: 'variancePct', header: 'Variance',
      render: (r: SupplierInvoice) => (
        <span style={{ fontSize: 12, fontWeight: 600, color: r.isFlagged ? '#DC2626' : 'var(--text-muted)' }}>
          {num(r.variancePct) > 0 ? '+' : ''}{num(r.variancePct)}%{r.isFlagged ? <Pill color="#DC2626" bg="var(--bg-sunken)"> Flagged</Pill> : null}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r: SupplierInvoice) => <Pill color={STATUS_META[r.status].color}>{STATUS_META[r.status].label}</Pill> },
    {
      key: 'actions', header: 'Set',
      render: (r: SupplierInvoice) => (
        <select className="tv-input" value={r.status} onClick={(e) => e.stopPropagation()} onChange={(e) => onStatus(r, e.target.value as InvoiceStatus)}>
          {STATUSES.map((s) => (<option key={s} value={s}>{STATUS_META[s].label}</option>))}
        </select>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Supplier Invoices"
        breadcrumbs={['Finance', 'Invoices']}
        actions={<button className="btn-brand" onClick={() => { setForm(EMPTY_FORM); setOpen(true); }}>+ Register Invoice</button>}
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Invoices" accent="var(--teal)"><span className="font-display" style={{ fontSize: 28, fontWeight: 700 }}>{summary.count}</span></StatCard>
        <StatCard title="Flagged (>15%)" accent="var(--danger)"><span className="font-display" style={{ fontSize: 28, fontWeight: 700, color: summary.flagged > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{summary.flagged}</span></StatCard>
        <StatCard title="Outstanding" accent="var(--danger)"><span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{inr(summary.outstanding)}</span></StatCard>
        <StatCard title="Total Billed" accent="var(--text-primary)"><span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{inr(summary.billed)}</span></StatCard>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search REF or invoice #…" />
        <label className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
          Flagged only
        </label>
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyLabel="No invoices found" pageSize={12} />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Register Supplier Invoice"
        footer={<LoadingButton className="btn-brand" loading={submitting} onClick={submit}>Save</LoadingButton>}
      >
        <div className="flex flex-col gap-3">
          <Field label="Vendor Invoice # *"><input className="tv-input w-full" value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} placeholder="e.g. VMO-102" /></Field>
          <Field label="Vehicle">
            <select className="tv-input w-full" value={form.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>
              <option value="">— none —</option>
              {vehicles.map((v) => (<option key={v.value} value={v.value}>{v.label}</option>))}
            </select>
          </Field>
          <div className="flex gap-3">
            <Field label="Ops Estimate (₹)"><input className="tv-input w-full" type="number" value={form.estimatedAmount} onChange={(e) => set('estimatedAmount', e.target.value)} /></Field>
            <Field label="Billed Amount (₹)"><input className="tv-input w-full" type="number" value={form.billedAmount} onChange={(e) => set('billedAmount', e.target.value)} /></Field>
          </div>
          {previewVariance && (
            <div style={{ fontSize: 12, color: previewVariance.flagged ? '#DC2626' : 'var(--text-muted)' }}>
              Variance: {previewVariance.pct > 0 ? '+' : ''}{previewVariance.pct}%
              {previewVariance.flagged ? ' — will be flagged (exceeds 15%)' : ''}
            </div>
          )}
          <Field label="Notes"><input className="tv-input w-full" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="REF link / remarks" /></Field>
        </div>
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
