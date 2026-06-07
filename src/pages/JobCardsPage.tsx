import React, { useEffect, useMemo, useState } from 'react';
import { useJobCards } from '../hooks/useJobCards';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import { getSelect, type SelectOption } from '../api/select.api';
import type { CreateJobCardBody, JobCard, JobCardStatus } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';
import { SearchInput } from '../components/SearchInput';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const Pill: React.FC<any> = UI.Pill;

const STATUSES: JobCardStatus[] = ['open', 'in_progress', 'quality_check', 'closed', 'cancelled'];

const STATUS_META: Record<JobCardStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'var(--accent-teal)' },
  in_progress: { label: 'In Progress', color: '#D97706' },
  quality_check: { label: 'Quality Check', color: '#7C3AED' },
  closed: { label: 'Closed', color: '#16A34A' },
  cancelled: { label: 'Cancelled', color: 'var(--text-muted)' },
};

const inr = (v: string | number): string => `₹${Number(v).toLocaleString('en-IN')}`;
const fmtDate = (s?: string | null): string => (s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

interface FormState {
  vehicleId: string;
  driverComplaint: string;
  entryOdometer: string;
  garageId: string;
}
const EMPTY_FORM: FormState = { vehicleId: '', driverComplaint: '', entryOdometer: '', garageId: '' };

export default function JobCardsPage() {
  const { allJobCards, loading, error, refetch, createJobCard, changeStatus } = useJobCards();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [garages, setGarages] = useState<SelectOption[]>([]);

  useEffect(() => {
    void getSelect('vehicles').then(setVehicles).catch(() => undefined);
    void getSelect('garages').then(setGarages).catch(() => undefined);
  }, []);

  const rows = useMemo(
    () =>
      (allJobCards as JobCard[]).filter(
        (jc) =>
          matchesSearch(jc, ['jobCardNumber', 'driverComplaint'], search) &&
          (!statusFilter || jc.status === statusFilter),
      ),
    [allJobCards, search, statusFilter],
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.vehicleId) return toast.error('Select a vehicle');
    if (!form.driverComplaint.trim()) return toast.error('Enter the driver complaint');
    setSubmitting(true);
    try {
      const body: CreateJobCardBody = {
        vehicleId: form.vehicleId,
        driverComplaint: form.driverComplaint.trim(),
        entryOdometer: form.entryOdometer ? Number(form.entryOdometer) : 0,
        garageId: form.garageId || null,
      };
      await createJobCard(body);
      toast.success('Job card created');
      setOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onStatusChange = async (jc: JobCard, status: JobCardStatus) => {
    try {
      await changeStatus(jc.id, status);
      toast.success(`${jc.jobCardNumber} → ${STATUS_META[status].label}`);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const columns = [
    { key: 'jobCardNumber', header: 'Job Card #', render: (r: JobCard) => <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{r.jobCardNumber}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (r: JobCard) => r.vehicle?.vehicleNumber ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r: JobCard) => <Pill color={STATUS_META[r.status].color}>{STATUS_META[r.status].label}</Pill>,
    },
    { key: 'driverComplaint', header: 'Complaint', render: (r: JobCard) => <span title={r.driverComplaint}>{r.driverComplaint.length > 40 ? `${r.driverComplaint.slice(0, 40)}…` : r.driverComplaint}</span> },
    { key: 'garage', header: 'Garage', render: (r: JobCard) => r.garage?.name ?? '—' },
    { key: 'totalJobCost', header: 'Cost', render: (r: JobCard) => inr(r.totalJobCost) },
    { key: 'entryTime', header: 'Entered', render: (r: JobCard) => fmtDate(r.entryTime) },
    {
      key: 'actions',
      header: 'Set Status',
      render: (r: JobCard) => (
        <select
          className="tv-input"
          value={r.status}
          onChange={(e) => onStatusChange(r, e.target.value as JobCardStatus)}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Job Cards"
        breadcrumbs={['Workshop', 'Job Cards']}
        actions={<button className="btn-brand" onClick={openModal}>+ New Job Card</button>}
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <div className="flex gap-3 flex-wrap items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search job card # or complaint…" />
        <select className="tv-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyLabel="No job cards found" pageSize={12} />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="New Job Card"
        footer={<LoadingButton className="btn-brand" loading={submitting} onClick={submit}>Create</LoadingButton>}
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Vehicle *</label>
            <select className="tv-input w-full" value={form.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Driver Complaint *</label>
            <textarea
              className="tv-input w-full"
              rows={3}
              value={form.driverComplaint}
              onChange={(e) => set('driverComplaint', e.target.value)}
              placeholder="What did the driver report?"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Entry Odometer (km)</label>
              <input
                className="tv-input w-full"
                type="number"
                value={form.entryOdometer}
                onChange={(e) => set('entryOdometer', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Garage</label>
              <select className="tv-input w-full" value={form.garageId} onChange={(e) => set('garageId', e.target.value)}>
                <option value="">Unassigned</option>
                {garages.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
