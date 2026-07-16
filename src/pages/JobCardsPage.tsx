import React, { useEffect, useMemo, useState } from 'react';
import { useJobCards } from '../hooks/useJobCards';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import { getSelect, type SelectOption } from '../api/select.api';
import * as jobCardsApi from '../api/job-cards.api';
import type { CreateJobCardBody, JobCard, JobCardStatus } from '../types/api.types';
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
  jobCardNumber: string;
  jobCardDate: string;
  vehicleId: string;
  /** Kept alongside the id so the job-card number can be re-suggested without a lookup list. */
  vehicleLabel: string;
  driverComplaint: string;
  entryOdometer: string;
  garageId: string;
}

// Today's date as an ISO "YYYY-MM-DD" value for a <input type="date">.
const todayISO = (): string => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: FormState = { jobCardNumber: '', jobCardDate: todayISO(), vehicleId: '', vehicleLabel: '', driverComplaint: '', entryOdometer: '', garageId: '' };

// Build the suggested "DD/MM/YY-VehicleNumber" job-card number from an ISO date + vehicle label.
const suggestJobCardNumber = (isoDate: string, vehicleLabel?: string): string => {
  if (!isoDate || !vehicleLabel) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y.slice(2)}-${vehicleLabel}`;
};

export default function JobCardsPage() {
  const { allJobCards, loading, error, refetch, createJobCard, changeStatus } = useJobCards();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [garages, setGarages] = useState<SelectOption[]>([]);
  const [assignees, setAssignees] = useState<SelectOption[]>([]);

  useEffect(() => {
    void getSelect('garages').then(setGarages).catch(() => undefined);
    void getSelect('assignees').then(setAssignees).catch(() => undefined);
  }, []);

  const onAssign = async (jc: JobCard, userId: string) => {
    try {
      await jobCardsApi.updateJobCard(jc.id, { supervisorId: userId || null });
      await refetch();
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

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

  // Re-suggest the job-card number from date + vehicle, unless the user has already
  // typed a value that differs from the current suggestion (i.e. edited it manually).
  const setVehicle = (vehicleId: string, vehicleLabel: string) =>
    setForm((f) => {
      const prevSuggestion = suggestJobCardNumber(f.jobCardDate, f.vehicleLabel);
      const keepManual = f.jobCardNumber && f.jobCardNumber !== prevSuggestion;
      return { ...f, vehicleId, vehicleLabel, jobCardNumber: keepManual ? f.jobCardNumber : suggestJobCardNumber(f.jobCardDate, vehicleLabel) };
    });

  const setDate = (jobCardDate: string) =>
    setForm((f) => {
      const prevSuggestion = suggestJobCardNumber(f.jobCardDate, f.vehicleLabel);
      const keepManual = f.jobCardNumber && f.jobCardNumber !== prevSuggestion;
      return { ...f, jobCardDate, jobCardNumber: keepManual ? f.jobCardNumber : suggestJobCardNumber(jobCardDate, f.vehicleLabel) };
    });

  const openModal = () => {
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.vehicleId) return toast.error('Select a vehicle');
    if (!form.jobCardNumber.trim()) return toast.error('Enter the job card number');
    if (!form.driverComplaint.trim()) return toast.error('Enter the driver complaint');
    setSubmitting(true);
    try {
      const body: CreateJobCardBody = {
        jobCardNumber: form.jobCardNumber.trim(),
        jobCardDate: form.jobCardDate ? new Date(form.jobCardDate).toISOString() : null,
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
    { key: 'jobCardDate', header: 'Date', render: (r: JobCard) => fmtDate(r.jobCardDate ?? r.entryTime) },
    { key: 'vehicle', header: 'Vehicle', render: (r: JobCard) => r.vehicle?.vehicleNumber ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r: JobCard) => <Pill color={STATUS_META[r.status].color}>{STATUS_META[r.status].label}</Pill>,
    },
    { key: 'driverComplaint', header: 'Complaint', render: (r: JobCard) => <span title={r.driverComplaint}>{r.driverComplaint.length > 40 ? `${r.driverComplaint.slice(0, 40)}…` : r.driverComplaint}</span> },
    { key: 'garage', header: 'Garage', render: (r: JobCard) => r.garage?.name ?? '—' },
    { key: 'totalJobCost', header: 'Cost', render: (r: JobCard) => inr(r.totalJobCost) },
    {
      key: 'supervisor',
      header: 'Assigned To',
      render: (r: JobCard) => (
        <select
          className="tv-input"
          value={r.supervisor?.id ?? ''}
          onChange={(e) => onAssign(r, e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="">Unassigned</option>
          {assignees.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      ),
    },
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
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Date</label>
              <input
                className="tv-input w-full"
                type="date"
                value={form.jobCardDate}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Vehicle *</label>
              <AsyncSelect
                entity="vehicles"
                value={form.vehicleId}
                valueLabel={form.vehicleLabel}
                onChange={(v, opt) => setVehicle(v, opt?.label ?? '')}
                placeholder="Select vehicle…"
                emptyLabel="No vehicles found"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Job Card Number *</label>
            <input
              className="tv-input w-full"
              style={{ fontFamily: 'var(--font-mono, monospace)' }}
              value={form.jobCardNumber}
              onChange={(e) => set('jobCardNumber', e.target.value)}
              placeholder="e.g. 11/06/26-8746"
            />
            <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Format: DD/MM/YY-VehicleNumber — auto-filled from the date &amp; vehicle, editable.
            </span>
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
