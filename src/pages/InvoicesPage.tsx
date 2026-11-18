import React, { useEffect, useMemo, useState } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import { getSelect, type SelectOption } from '../api/select.api';
import type { CreateInvoiceBody, InvoicePaymentStatus, SupplierInvoice } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';
import { SearchInput } from '../components/SearchInput';
import { AsyncSelect } from '../components/AsyncSelect';

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

const STATUS_META: Record<InvoicePaymentStatus, { label: string; color: string }> = {
  on_credit: { label: 'On Credit', color: '#D97706' },
  fully_paid: { label: 'Fully Paid', color: '#16A34A' },
};
const STATUSES: InvoicePaymentStatus[] = ['on_credit', 'fully_paid'];

interface FormState {
  invoiceNumber: string;
  vehicleId: string;
  jobCardId: string;
  vendorId: string;
  totalAmount: string;
  paymentStatus: InvoicePaymentStatus;
  paymentMode: 'cash' | 'credit';
  paidAmount: string;
  notes: string;
}
const EMPTY_FORM: FormState = {
  invoiceNumber: '', vehicleId: '', jobCardId: '', vendorId: '',
  totalAmount: '', paymentStatus: 'on_credit', paymentMode: 'credit', paidAmount: '', notes: '',
};

export default function InvoicesPage() {
  const { allInvoices, loading, error, refetch, createInvoice, setPaymentStatus } = useInvoices();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [jobCards, setJobCards] = useState<SelectOption[]>([]);
  const [vendors, setVendors] = useState<SelectOption[]>([]);

  useEffect(() => {
    void getSelect('job-cards').then(setJobCards).catch(() => undefined);
    // Billing vendors: spare parts vendors and garages / workshops, labelled "Name · CODE".
    void Promise.all([getSelect('vendors', { status: 'spare_parts' }), getSelect('vendors', { status: 'garage' })])
      .then(([sp, ga]) => setVendors([...sp, ...ga].sort((a, b) => a.label.localeCompare(b.label))))
      .catch(() => undefined);
  }, []);

  const summary = useMemo(() => {
    const onCredit = allInvoices.filter((i) => i.paymentStatus === 'on_credit');
    const onCreditAmt = onCredit.reduce((s, i) => s + num(i.totalAmount), 0);
    const total = allInvoices.reduce((s, i) => s + num(i.totalAmount), 0);
    return { onCreditCount: onCredit.length, onCreditAmt, total, count: allInvoices.length };
  }, [allInvoices]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (allInvoices as SupplierInvoice[]).filter(
      (i) =>
        matchesSearch(i, ['refNumber', 'invoiceNumber'], search) ||
        (!!q && (i.vehicle?.vehicleNumber?.toLowerCase().includes(q) ?? false)),
    );
  }, [allInvoices, search]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.invoiceNumber.trim()) return toast.error('Enter the supplied invoice number');
    const total = form.totalAmount ? Number(form.totalAmount) : 0;
    const paid = form.paidAmount ? Number(form.paidAmount) : 0;
    if (paid > total) return toast.error('The paid amount cannot be more than the bill amount');
    setSubmitting(true);
    try {
      const body: CreateInvoiceBody = {
        invoiceNumber: form.invoiceNumber.trim(),
        vehicleId: form.vehicleId || null,
        jobCardId: form.jobCardId || null,
        vendorId: form.vendorId || null,
        totalAmount: total,
        paymentMode: form.paymentMode,
        paidAmount: paid,
        paymentStatus: total > 0 && paid >= total ? 'fully_paid' : 'on_credit',
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

  const onStatus = async (inv: SupplierInvoice, paymentStatus: InvoicePaymentStatus) => {
    try {
      await setPaymentStatus(inv.id, paymentStatus);
      toast.success(`${inv.refNumber} → ${STATUS_META[paymentStatus].label}`);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const columns = [
    { key: 'refNumber', header: 'Invoice No', render: (r: SupplierInvoice) => <span className="font-mono" style={{ color: 'var(--teal)' }}>{r.refNumber}</span> },
    { key: 'invoiceNumber', header: 'Supplied #', render: (r: SupplierInvoice) => <span className="font-mono">{r.invoiceNumber}</span> },
    { key: 'vendor', header: 'Vendor', render: (r: SupplierInvoice) => r.supplier ? <span>{r.supplier.name} <span className="font-mono" style={{ color: 'var(--text-dim)' }}>· {r.supplier.vendorCode}</span></span> : (r.vendor?.vendorName ?? '—') },
    { key: 'vehicle', header: 'Vehicle', render: (r: SupplierInvoice) => r.vehicle?.vehicleNumber ?? '—' },
    { key: 'jobCard', header: 'Job Card', render: (r: SupplierInvoice) => r.jobCard?.jobCardNumber ?? '—' },
    { key: 'totalAmount', header: 'Bill Raised', render: (r: SupplierInvoice) => inr(r.billRaisedAmount ?? r.totalAmount) },
    { key: 'billPaid', header: 'Bill Paid', render: (r: SupplierInvoice) => inr(r.billPaidAmount ?? 0) },
    { key: 'paymentMode', header: 'Cash / Credit', render: (r: SupplierInvoice) => <Pill color={r.paymentMode === 'cash' ? 'var(--teal)' : 'var(--warning)'}>{r.paymentMode === 'cash' ? 'Cash' : 'Credit'}</Pill> },
    {
      key: 'photo', header: 'Photo',
      render: (r: SupplierInvoice) => (r.photoUrl
        ? <a href={r.photoUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}><img src={r.photoUrl} alt="invoice" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 4 }} /></a>
        : <span style={{ color: 'var(--text-muted)' }}>—</span>),
    },
    { key: 'paymentStatus', header: 'Paid / Pending', render: (r: SupplierInvoice) => <Pill color={r.settlement === 'paid' ? 'var(--success)' : 'var(--danger)'}>{r.settlement === 'paid' ? 'Paid' : 'Pending'}</Pill> },
    {
      key: 'actions', header: 'Set',
      render: (r: SupplierInvoice) => (
        <select className="tv-input" value={r.paymentStatus} onClick={(e) => e.stopPropagation()} onChange={(e) => onStatus(r, e.target.value as InvoicePaymentStatus)}>
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
        <StatCard title="On Credit" accent="var(--warning)"><span className="font-display" style={{ fontSize: 28, fontWeight: 700, color: summary.onCreditCount > 0 ? '#D97706' : 'var(--text-primary)' }}>{summary.onCreditCount}</span></StatCard>
        <StatCard title="Credit Outstanding" accent="var(--warning)"><span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{inr(summary.onCreditAmt)}</span></StatCard>
        <StatCard title="Total Value" accent="var(--text-primary)"><span className="font-display" style={{ fontSize: 22, fontWeight: 700 }}>{inr(summary.total)}</span></StatCard>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice no, ref # or vehicle…" />
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyLabel="No invoices found" pageSize={12} />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Register Supplier Invoice"
        footer={<LoadingButton className="btn-brand" loading={submitting} onClick={submit}>Save</LoadingButton>}
      >
        <div className="flex flex-col gap-3">
          <Field label="Supplied Invoice # *"><input className="tv-input w-full" value={form.invoiceNumber} onChange={(e) => set('invoiceNumber', e.target.value)} placeholder="e.g. VMO-102" /></Field>
          <div className="flex gap-3">
            <Field label="Billing vendor (spare parts vendor or garage)">
              <select className="tv-input w-full" value={form.vendorId} onChange={(e) => set('vendorId', e.target.value)}>
                <option value="">— none —</option>
                {vendors.map((v) => (<option key={v.value} value={v.value}>{v.label}</option>))}
              </select>
            </Field>
            <Field label="Vehicle">
              <AsyncSelect
                entity="vehicles"
                value={form.vehicleId}
                onChange={(v) => set('vehicleId', v)}
                placeholder="— none —"
                clearable
                clearLabel="— none —"
                emptyLabel="No vehicles found"
              />
            </Field>
          </div>
          <Field label="Job Card">
            <select className="tv-input w-full" value={form.jobCardId} onChange={(e) => set('jobCardId', e.target.value)}>
              <option value="">— none —</option>
              {jobCards.map((j) => (<option key={j.value} value={j.value}>{j.label}</option>))}
            </select>
          </Field>
          <div className="flex gap-3">
            <Field label="Total Amount (₹)"><input className="tv-input w-full" type="number" value={form.totalAmount} onChange={(e) => set('totalAmount', e.target.value)} /></Field>
            <Field label="Bought on">
              <select className="tv-input w-full" value={form.paymentMode} onChange={(e) => set('paymentMode', e.target.value as 'cash' | 'credit')}>
                <option value="credit">Credit</option>
                <option value="cash">Cash</option>
              </select>
            </Field>
          </div>
          <Field label="Paid so far (₹)"><input className="tv-input w-full" type="number" value={form.paidAmount} onChange={(e) => set('paidAmount', e.target.value)} placeholder="0" /></Field>
          <Field label="Notes"><input className="tv-input w-full" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Remarks" /></Field>
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
