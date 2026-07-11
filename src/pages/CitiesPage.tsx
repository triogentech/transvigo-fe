import React, { useState } from 'react';
import { useCities } from '../hooks/useCities';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import type { CreateCityBody, City } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';
import { SearchInput } from '../components/SearchInput';

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
  const { allCities, loading, error, refetch, createCity, updateCity, deleteCity } = useCities();
  const [search, setSearch] = useState('');
  const rows = React.useMemo(
    () => (allCities as City[]).filter((c) => matchesSearch(c, ['name', 'cityCode', 'state', 'stateCode'], search)),
    [allCities, search],
  );
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCityBody>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [delRow, setDelRow] = useState<City | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const set = (k: keyof CreateCityBody, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (c: City) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      cityCode: c.cityCode,
      state: c.state,
      stateCode: c.stateCode,
      country: c.country,
      countryISOCode: c.countryISOCode,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Enter a name');
    setSubmitting(true);
    try {
      if (editingId) {
        await updateCity(editingId, form);
        toast.success('City updated');
      } else {
        await createCity(form);
        toast.success('City created');
      }
      setOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!delRow) return;
    setDelBusy(true);
    try {
      await deleteCity(delRow.id);
      toast.success('City deleted');
      setDelRow(null);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setDelBusy(false);
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
    {
      key: 'actions',
      header: 'Actions',
      render: (row: City) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="btn-ghost" onClick={() => openEdit(row)}>Edit</button>
          <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setDelRow(row)}>Delete</button>
        </div>
      ),
    },
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

      <SearchInput value={search} onChange={setSearch} placeholder="Search cities…" />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyLabel="No cities found"
        pageSize={10}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editingId ? 'Edit City' : 'Add City'}
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

      <Modal
        open={!!delRow}
        onOpenChange={(v: boolean) => { if (!v) setDelRow(null); }}
        title="Delete City"
        footer={
          <LoadingButton className="btn-brand" loading={delBusy} onClick={confirmDelete}
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
            Delete
          </LoadingButton>
        }
      >
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Delete <b>{delRow?.name}</b>? This can’t be undone. Records referencing this city will keep their data but lose the city reference.
        </div>
      </Modal>
    </div>
  );
}
