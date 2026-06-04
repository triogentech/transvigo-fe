import React, { useState } from 'react';
import { useTollLogs } from '../hooks/useTollLogs';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { shortDate, formatINR } from '../lib/utils.js';
import type { CreateTollLogBody, TollLog } from '../types/api.types';
import { ErrorBanner, LoadingButton, SkeletonTable } from '../components/states';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;

interface FormState {
  totalTollAmount: string;
  numberOfTollCrosses: string;
}

const EMPTY_FORM: FormState = { totalTollAmount: '', numberOfTollCrosses: '1' };

export default function TollLogsPage() {
  const { tollLogs, loading, error, refetch, createTollLog } = useTollLogs();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const body: CreateTollLogBody = {
        totalTollAmount: parseFloat(form.totalTollAmount) || 0,
        numberOfTollCrosses: parseInt(form.numberOfTollCrosses, 10) || 1,
      };
      await createTollLog(body);
      toast.success('Toll log created');
      setOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'createdAt', header: 'Date', render: (row: TollLog) => shortDate(row.createdAt) },
    {
      key: 'totalTollAmount',
      header: 'Amount',
      render: (row: TollLog) => <span className="font-mono">{formatINR(row.totalTollAmount)}</span>,
    },
    {
      key: 'numberOfTollCrosses',
      header: 'Crossings',
      render: (row: TollLog) => <span className="font-mono">{row.numberOfTollCrosses}</span>,
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row: TollLog) =>
        row.vehicle?.vehicleNumber ? (
          <span className="font-mono">{row.vehicle.vehicleNumber}</span>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>—</span>
        ),
    },
    {
      key: 'trip',
      header: 'Trip',
      render: (row: TollLog) =>
        row.trip?.tripNumber ? (
          <span className="font-mono">{row.trip.tripNumber}</span>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>—</span>
        ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Toll Logs" breadcrumbs={['Finance', 'Toll Logs']} />
        <SkeletonTable rows={8} cols={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Toll Logs" breadcrumbs={['Finance', 'Toll Logs']} />
        <ErrorBanner message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Toll Logs"
        breadcrumbs={['Finance', 'Toll Logs']}
        actions={
          <button className="btn-brand" onClick={openModal}>
            + Add Toll Log
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={tollLogs}
        loading={loading}
        emptyLabel="No toll logs found"
        pageSize={10}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add Toll Log"
        footer={
          <LoadingButton className="btn-brand" loading={submitting} onClick={submit}>
            Save
          </LoadingButton>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Total Toll Amount (₹)
            </label>
            <input
              type="number"
              className="tv-input w-full font-mono"
              value={form.totalTollAmount}
              onChange={(e) => set('totalTollAmount', e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Number of Crossings
            </label>
            <input
              type="number"
              className="tv-input w-full font-mono"
              value={form.numberOfTollCrosses}
              onChange={(e) => set('numberOfTollCrosses', e.target.value)}
              placeholder="1"
              min="1"
              step="1"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
