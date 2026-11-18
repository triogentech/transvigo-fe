// API CALLS: 1 (GET /api/pages/maintenance)
import React, { useRef, useState } from 'react';
import { useMaintenancePage } from '../hooks/pages/useMaintenancePage';
import { useGarageLogsActions } from '../hooks/actions/useGarageLogsActions';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { shortDate, formatINR } from '../lib/utils.js';
import type { VendorBillRow } from '../api/pages.api';
import type { CreateGarageLogBody, GarageLog } from '../types/api.types';
import { ErrorBanner, LoadingButton, SkeletonTable } from '../components/states';
import { AsyncSelect } from '../components/AsyncSelect';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const Pill: React.FC<any> = UI.Pill;

interface FormState {
  invoiceDate: string;
  particular: string;
  invoiceRaisedAmount: string;
  invoicePassedAmount: string;
}

const EMPTY_FORM: FormState = {
  invoiceDate: '',
  particular: '',
  invoiceRaisedAmount: '',
  invoicePassedAmount: '',
};

export default function MaintenancePage() {
  const { garageLogs, invoices, invoiceTotals, filterOptions, summary, loading, error, refetch, filters, setFilters } = useMaintenancePage();

  // Vehicle id → label, so an already-applied vehicle filter shows its number
  // rather than a raw UUID before the combobox has loaded any page.
  const vehicleNameById = React.useMemo(() => {
    const m = new Map<string, string>();
    (filterOptions?.vehicles ?? []).forEach((o) => m.set(o.value, o.label));
    return m;
  }, [filterOptions]);
  const { createGarageLog, uploadInvoice } = useGarageLogsActions();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const body: CreateGarageLogBody = {
        invoiceDate: form.invoiceDate,
        particular: form.particular,
        invoiceRaisedAmount: parseFloat(form.invoiceRaisedAmount) || 0,
        invoicePassedAmount: parseFloat(form.invoicePassedAmount) || 0,
      };
      await createGarageLog(body);
      await refetch();
      toast.success('Maintenance log created');
      setOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (row: GarageLog, file: File) => {
    setUploading(true);
    try {
      await uploadInvoice(row.id, file);
      await refetch();
      toast.success('Invoice uploaded');
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      key: 'invoiceDate',
      header: 'Invoice Date',
      render: (row: GarageLog) => shortDate(row.invoiceDate),
    },
    { key: 'particular', header: 'Particular' },
    {
      key: 'invoiceRaisedAmount',
      header: 'Raised',
      render: (row: GarageLog) => (
        <span className="font-mono">{formatINR(row.invoiceRaisedAmount)}</span>
      ),
    },
    {
      key: 'invoicePassedAmount',
      header: 'Passed',
      render: (row: GarageLog) => (
        <span className="font-mono">{formatINR(row.invoicePassedAmount)}</span>
      ),
    },
    {
      key: 'invoiceUrl',
      header: 'Invoice',
      render: (row: GarageLog) =>
        row.invoiceUrl ? (
          <a
            href={row.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-teal)', fontSize: 13 }}
          >
            View
          </a>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>—</span>
        ),
    },
    {
      key: '_upload',
      header: '',
      width: 130,
      render: (row: GarageLog) => (
        <>
          <input
            type="file"
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            ref={(el) => { fileInputRefs.current[row.id] = el; }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileChange(row, file);
              e.target.value = '';
            }}
          />
          <button
            className="btn-ghost"
            style={{ fontSize: 12, padding: '3px 8px' }}
            disabled={uploading}
            onClick={() => fileInputRefs.current[row.id]?.click()}
          >
            {uploading ? 'Uploading…' : 'Upload Invoice'}
          </button>
        </>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Maintenance" breadcrumbs={['Operations', 'Maintenance']} />
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Maintenance" breadcrumbs={['Operations', 'Maintenance']} />
        <ErrorBanner message={error} onRetry={refetch} />
      </div>
    );
  }

  const garageOptions = [
    { value: '', label: 'All Garages' },
    ...(filterOptions?.garages ?? []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Maintenance"
        breadcrumbs={['Operations', 'Maintenance']}
        actions={
          <button className="btn-brand" onClick={openModal}>
            + Add Log
          </button>
        }
      />

      {/* Summary cards */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} className="tv-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{key}</div>
              <div className="font-mono" style={{ fontSize: 22, marginTop: 6, color: 'var(--text-primary)' }}>{formatINR(val as number)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap">
          <div style={{ minWidth: 200 }}>
            <AsyncSelect
              entity="vehicles"
              value={(filters.vehicleId as string) ?? ''}
              valueLabel={vehicleNameById.get(filters.vehicleId as string) ?? ''}
              onChange={(v) => setFilters({ vehicleId: v || undefined, page: 1 })}
              placeholder="All Vehicles"
              clearable
              clearLabel="All Vehicles"
              emptyLabel="No vehicles found"
            />
          </div>
          {garageOptions.length > 1 && (
            <select
              className="tv-input"
              onChange={(e) => setFilters({ garageId: e.target.value || undefined, page: 1 })}
            >
              {garageOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
        </div>

      {/* Vendor bills: invoices the operations team registers in the app */}
      <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Vendor bills</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Registered by operations in the app: billing vendor, vehicle, amounts, cash or credit, paid or pending.</div>
        </div>
        <div className="flex gap-4" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Raised <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{formatINR(invoiceTotals.billRaised)}</span></span>
          <span>Paid <span className="font-mono" style={{ color: 'var(--success)' }}>{formatINR(invoiceTotals.billPaid)}</span></span>
          <span>Pending <span className="font-mono" style={{ color: 'var(--danger)' }}>{formatINR(Math.max(0, invoiceTotals.billRaised - invoiceTotals.billPaid))}</span></span>
        </div>
      </div>
      <DataTable
        columns={[
          { key: 'vendorName', header: 'Vendor Name', render: (r: VendorBillRow) => r.vendorName ?? '—' },
          { key: 'vendorCode', header: 'Vendor Code', render: (r: VendorBillRow) => <span className="font-mono">{r.vendorCode ?? '—'}</span> },
          { key: 'vehicleNumber', header: 'Vehicle No.', render: (r: VendorBillRow) => <span className="font-mono">{r.vehicleNumber ?? '—'}</span> },
          { key: 'billRaisedAmount', header: 'Bill Raised', render: (r: VendorBillRow) => <span className="font-mono">{formatINR(r.billRaisedAmount)}</span> },
          { key: 'billPaidAmount', header: 'Bill Paid', render: (r: VendorBillRow) => <span className="font-mono">{formatINR(r.billPaidAmount)}</span> },
          { key: 'paymentMode', header: 'Cash / Credit', render: (r: VendorBillRow) => <Pill color={r.paymentMode === 'cash' ? 'var(--teal)' : 'var(--warning)'}>{r.paymentMode === 'cash' ? 'Cash' : 'Credit'}</Pill> },
          { key: 'settlement', header: 'Paid / Pending', render: (r: VendorBillRow) => <Pill color={r.settlement === 'paid' ? 'var(--success)' : 'var(--danger)'}>{r.settlement === 'paid' ? 'Paid' : 'Pending'}</Pill> },
        ]}
        data={invoices}
        loading={loading}
        emptyLabel="No vendor bills registered yet"
        pageSize={10}
      />

      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 8 }}>Maintenance logs</div>
      <DataTable
        columns={columns}
        data={garageLogs}
        loading={loading}
        emptyLabel="No maintenance logs found"
        pageSize={10}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add Maintenance Log"
        footer={
          <LoadingButton
            className="btn-brand"
            loading={submitting}
            onClick={submit}
          >
            Save
          </LoadingButton>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Invoice Date
            </label>
            <input
              type="date"
              className="tv-input w-full"
              value={form.invoiceDate}
              onChange={(e) => set('invoiceDate', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Particular
            </label>
            <input
              className="tv-input w-full"
              value={form.particular}
              onChange={(e) => set('particular', e.target.value)}
              placeholder="Description of work done"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Invoice Raised (₹)
              </label>
              <input
                type="number"
                className="tv-input w-full"
                value={form.invoiceRaisedAmount}
                onChange={(e) => set('invoiceRaisedAmount', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Invoice Passed (₹)
              </label>
              <input
                type="number"
                className="tv-input w-full"
                value={form.invoicePassedAmount}
                onChange={(e) => set('invoicePassedAmount', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
