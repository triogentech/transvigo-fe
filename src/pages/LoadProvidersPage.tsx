import React, { useState } from 'react';
import { useLoadProviders } from '../hooks/useLoadProviders';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import type { CreateLoadProviderBody } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const Pill: React.FC<any> = UI.Pill;
const TVSwitch: React.FC<any> = UI.TVSwitch;

interface FormState {
  name: string;
  shortName: string;
  contactNumber: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  shortName: '',
  contactNumber: '',
  isActive: true,
};

export default function LoadProvidersPage() {
  const { loadProviders, loading, error, refetch, createLoadProvider } = useLoadProviders();
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
      const body: CreateLoadProviderBody = {
        name: form.name,
        shortName: form.shortName || undefined,
        contactNumber: form.contactNumber,
        isActive: form.isActive,
      };
      await createLoadProvider(body);
      toast.success('Load provider created');
      setOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'shortName', header: 'Short Name' },
    {
      key: 'contactNumber',
      header: 'Contact',
      render: (row: { contactNumber: string }) => (
        <span className="font-mono">{row.contactNumber}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: { isActive: boolean }) =>
        row.isActive ? (
          <Pill color="var(--accent-teal)">Active</Pill>
        ) : (
          <Pill color="var(--text-muted)" bg="var(--bg-sunken)" border="var(--border-strong)">
            Inactive
          </Pill>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Load Providers"
        breadcrumbs={['Settings', 'Load Providers']}
        actions={
          <button className="btn-brand" onClick={openModal}>
            + Add Load Provider
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <DataTable
        columns={columns}
        data={loadProviders}
        loading={loading}
        emptyLabel="No load providers found"
        pageSize={10}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add Load Provider"
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
              Name
            </label>
            <input
              className="tv-input w-full"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Provider name"
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Short Name
            </label>
            <input
              className="tv-input w-full"
              value={form.shortName}
              onChange={(e) => set('shortName', e.target.value)}
              placeholder="Optional short name"
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Contact Number
            </label>
            <input
              className="tv-input w-full font-mono"
              value={form.contactNumber}
              onChange={(e) => set('contactNumber', e.target.value)}
              placeholder="Phone number"
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Active</span>
            <TVSwitch
              checked={form.isActive}
              onCheckedChange={(v: boolean) => set('isActive', v)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
