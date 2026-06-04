import React, { useState } from 'react';
import { useGarages } from '../hooks/useGarages';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import type { CreateGarageBody } from '../types/api.types';
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
  isActive: boolean;
}

const EMPTY_FORM: FormState = { name: '', isActive: true };

export default function GaragesPage() {
  const { garages, loading, error, refetch, createGarage } = useGarages();
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
      const body: CreateGarageBody = { name: form.name, isActive: form.isActive };
      await createGarage(body);
      toast.success('Garage created');
      setOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
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
        title="Garages"
        breadcrumbs={['Settings', 'Garages']}
        actions={
          <button className="btn-brand" onClick={openModal}>
            + Add Garage
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <DataTable
        columns={columns}
        data={garages}
        loading={loading}
        emptyLabel="No garages found"
        pageSize={10}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add Garage"
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
              placeholder="Garage name"
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
