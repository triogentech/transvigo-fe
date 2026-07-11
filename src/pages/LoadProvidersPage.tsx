import React, { useState } from 'react';
import { useLoadProviders } from '../hooks/useLoadProviders';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import type { CreateLoadProviderBody, LoadProvider } from '../types/api.types';
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
  const { allLoadProviders, loading, error, refetch, createLoadProvider, updateLoadProvider, deleteLoadProvider } = useLoadProviders();
  const [search, setSearch] = useState('');
  const rows = React.useMemo(
    () => (allLoadProviders as LoadProvider[]).filter((lp) => matchesSearch(lp, ['name', 'shortName', 'contactNumber'], search)),
    [allLoadProviders, search],
  );
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [delRow, setDelRow] = useState<LoadProvider | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (lp: LoadProvider) => {
    setEditingId(lp.id);
    setForm({
      name: lp.name,
      shortName: lp.shortName ?? '',
      contactNumber: lp.contactNumber ?? '',
      isActive: lp.isActive,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Enter a name');
    setSubmitting(true);
    try {
      const body: CreateLoadProviderBody = {
        name: form.name,
        shortName: form.shortName || undefined,
        contactNumber: form.contactNumber,
        isActive: form.isActive,
      };
      if (editingId) {
        await updateLoadProvider(editingId, body);
        toast.success('Load provider updated');
      } else {
        await createLoadProvider(body);
        toast.success('Load provider created');
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
      await deleteLoadProvider(delRow.id);
      toast.success('Load provider deleted');
      setDelRow(null);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setDelBusy(false);
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
    {
      key: 'actions',
      header: 'Actions',
      render: (row: LoadProvider) => (
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
        title="Load Providers"
        breadcrumbs={['Settings', 'Load Providers']}
        actions={
          <button className="btn-brand" onClick={openModal}>
            + Add Load Provider
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <SearchInput value={search} onChange={setSearch} placeholder="Search load providers…" />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyLabel="No load providers found"
        pageSize={10}
      />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editingId ? 'Edit Load Provider' : 'Add Load Provider'}
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

      <Modal
        open={!!delRow}
        onOpenChange={(v: boolean) => { if (!v) setDelRow(null); }}
        title="Delete Load Provider"
        footer={
          <LoadingButton
            className="btn-brand"
            loading={delBusy}
            onClick={confirmDelete}
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
          >
            Delete
          </LoadingButton>
        }
      >
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Delete <b>{delRow?.name}</b>? This can’t be undone. Any trips linked to this provider will keep their history but lose the provider reference.
        </div>
      </Modal>
    </div>
  );
}
