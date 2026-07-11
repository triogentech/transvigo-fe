import React, { useState } from 'react';
import { useFuelStations } from '../hooks/useFuelStations';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import type { CreateFuelStationBody, FuelStation } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';
import { SearchInput } from '../components/SearchInput';

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

export default function FuelStationsPage() {
  const { allFuelStations, loading, error, refetch, createFuelStation, updateFuelStation, deleteFuelStation } = useFuelStations();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [delRow, setDelRow] = useState<FuelStation | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const rows = React.useMemo(
    () =>
      (allFuelStations as FuelStation[]).filter(
        (s) =>
          matchesSearch(s, ['name'], search) &&
          (!statusFilter || String(s.isActive ?? true) === statusFilter),
      ),
    [allFuelStations, search, statusFilter],
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (s: FuelStation) => {
    setEditingId(s.id);
    setForm({ name: s.name, isActive: s.isActive ?? true });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Enter a name');
    setSubmitting(true);
    try {
      const body: CreateFuelStationBody = { name: form.name, isActive: form.isActive };
      if (editingId) {
        await updateFuelStation(editingId, body);
        toast.success('Fuel station updated');
      } else {
        await createFuelStation(body);
        toast.success('Fuel station created');
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
      await deleteFuelStation(delRow.id);
      toast.success('Fuel station deleted');
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
    {
      key: 'actions',
      header: 'Actions',
      render: (row: FuelStation) => (
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
        title="Fuel Stations"
        breadcrumbs={['Settings', 'Fuel Stations']}
        actions={
          <button className="btn-brand" onClick={openModal}>
            + Add Fuel Station
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <div className="flex gap-3 flex-wrap items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search stations…" />
        <select
          className="tv-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyLabel="No fuel stations found"
        pageSize={10}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editingId ? 'Edit Fuel Station' : 'Add Fuel Station'}
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
              placeholder="Station name"
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

      <Modal
        open={!!delRow}
        onOpenChange={(v: boolean) => { if (!v) setDelRow(null); }}
        title="Delete Fuel Station"
        footer={
          <LoadingButton className="btn-brand" loading={delBusy} onClick={confirmDelete}
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
            Delete
          </LoadingButton>
        }
      >
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Delete <b>{delRow?.name}</b>? This can’t be undone. Fuel logs referencing this station will keep their data but lose the station reference.
        </div>
      </Modal>
    </div>
  );
}
