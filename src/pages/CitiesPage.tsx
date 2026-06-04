import React, { useState } from 'react';
import { useCities } from '../hooks/useCities';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import type { CreateCityBody } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';

// ui.jsx is a JS module — pull components as any to avoid prop-shape mismatches
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;

const EMPTY_FORM: CreateCityBody = {
  name: '',
  cityCode: '',
  state: '',
  stateCode: '',
  country: 'India',
  countryISOCode: 'IN',
};

export default function CitiesPage() {
  const { cities, loading, error, refetch, createCity } = useCities();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateCityBody>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof CreateCityBody, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await createCity(form);
      toast.success('City created');
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
      key: 'cityCode',
      header: 'City Code',
      render: (row: { cityCode: string }) => (
        <span className="font-mono">{row.cityCode}</span>
      ),
    },
    { key: 'state', header: 'State' },
    { key: 'country', header: 'Country' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Cities"
        breadcrumbs={['Settings', 'Cities']}
        actions={
          <button className="btn-brand" onClick={openModal}>
            + Add City
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <DataTable
        columns={columns}
        data={cities}
        loading={loading}
        emptyLabel="No cities found"
        pageSize={10}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add City"
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
              placeholder="City name"
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              City Code
            </label>
            <input
              className="tv-input w-full font-mono"
              value={form.cityCode}
              onChange={(e) => set('cityCode', e.target.value)}
              placeholder="e.g. MUM"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                State
              </label>
              <input
                className="tv-input w-full"
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
                placeholder="State name"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                State Code
              </label>
              <input
                className="tv-input w-full font-mono"
                value={form.stateCode}
                onChange={(e) => set('stateCode', e.target.value)}
                placeholder="e.g. MH"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Country
              </label>
              <input
                className="tv-input w-full"
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Country ISO Code
              </label>
              <input
                className="tv-input w-full font-mono"
                value={form.countryISOCode}
                onChange={(e) => set('countryISOCode', e.target.value)}
                placeholder="IN"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
