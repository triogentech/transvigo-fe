// API CALLS: 1 (GET /api/pages/maintenance)
import React, { useRef, useState } from 'react';
import { useMaintenancePage } from '../hooks/pages/useMaintenancePage';
import { useGarageLogsActions } from '../hooks/actions/useGarageLogsActions';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { shortDate, formatINR } from '../lib/utils.js';
import type { CreateGarageLogBody, GarageLog } from '../types/api.types';
import { ErrorBanner, LoadingButton, SkeletonTable } from '../components/states';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;

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
  const { garageLogs, filterOptions, summary, loading, error, refetch, setFilters } = useMaintenancePage();
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

  const vehicleOptions = [
    { value: '', label: 'All Vehicles' },
    ...(filterOptions?.vehicles ?? []),
  ];
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
      {(vehicleOptions.length > 1 || garageOptions.length > 1) && (
        <div className="flex gap-3 flex-wrap">
          {vehicleOptions.length > 1 && (
            <select
              className="tv-input"
              onChange={(e) => setFilters({ vehicleId: e.target.value || undefined, page: 1 })}
            >
              {vehicleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          {garageOptions.length > 1 && (
            <select
              className="tv-input"
              onChange={(e) => setFilters({ garageId: e.target.value || undefined, page: 1 })}
            >
              {garageOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
        </div>
      )}

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
