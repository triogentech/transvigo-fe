import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import { getVendors, createVendor, updateVendor, deleteVendor, canDelete, type Vendor, type ManagedVendorType } from '../api/vendors.api';
import { clearSelectCache } from '../api/select.api';
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

const TYPES: Array<{ value: ManagedVendorType; label: string; prefix: string }> = [
  { value: 'garage', label: 'Garage / workshop', prefix: 'WS' },
  { value: 'spare_parts', label: 'Spare parts vendor', prefix: 'SP' },
  { value: 'fuel_station', label: 'Fuel station vendor', prefix: 'FS' },
  { value: 'tyre_hub', label: 'Tyre hub vendor', prefix: 'TH' },
];
const TYPE_COLOR: Record<string, string> = {
  garage: 'var(--accent-teal)',
  spare_parts: 'var(--warning)',
  fuel_station: 'var(--info, #2563EB)',
  tyre_hub: 'var(--purple, #7C3AED)',
};
const typeLabel = (t: string): string => TYPES.find((x) => x.value === t)?.label ?? t;

interface FormState {
  type: ManagedVendorType;
  name: string;
  vendorCode: string;
  contactPerson: string;
  contactNumber: string;
  notes: string;
  isActive: boolean;
}
const EMPTY_FORM: FormState = { type: 'garage', name: '', vendorCode: '', contactPerson: '', contactNumber: '', notes: '', isActive: true };

const inr = (v: number): string => `₹${Number(v).toLocaleString('en-IN')}`;

/** Vendors: garages / workshops, spare parts, fuel station and tyre hub vendors, each with a vendor code. */
export default function VendorsPage() {
  const toast = useToast();
  const [all, setAll] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [delRow, setDelRow] = useState<Vendor | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAll((await getVendors()).data);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(
    () => all.filter((v) => matchesSearch(v, ['name', 'vendorCode', 'contactPerson', 'contactNumber'], search) && (!typeFilter || v.type === typeFilter) && (!statusFilter || String(v.isActive) === statusFilter)),
    [all, search, typeFilter, statusFilter],
  );
  const count = (t: ManagedVendorType): number => all.filter((v) => v.type === t).length;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const openAdd = (type: ManagedVendorType = 'garage') => { setEditing(null); setForm({ ...EMPTY_FORM, type }); setOpen(true); };
  const openEdit = (v: Vendor) => {
    setEditing(v);
    setForm({ type: v.type as ManagedVendorType, name: v.name, vendorCode: v.vendorCode, contactPerson: v.contactPerson ?? '', contactNumber: v.contactNumber ?? '', notes: v.notes ?? '', isActive: v.isActive });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Enter a name');
    setSubmitting(true);
    try {
      const common = { name: form.name.trim(), contactPerson: form.contactPerson.trim() || null, contactNumber: form.contactNumber.trim() || null, notes: form.notes.trim() || null };
      if (editing) {
        await updateVendor(editing.id, { ...common, vendorCode: form.vendorCode.trim() || undefined, isActive: form.isActive });
        toast.success('Vendor updated');
      } else {
        const created = await createVendor({ type: form.type, ...common, vendorCode: form.vendorCode.trim() || undefined });
        toast.success(`${typeLabel(form.type)} ${created.vendorCode} added`);
      }
      clearSelectCache();
      setOpen(false);
      await load();
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
      await deleteVendor(delRow);
      toast.success('Vendor deleted');
      clearSelectCache();
      setDelRow(null);
      await load();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setDelBusy(false);
    }
  };

  const columns = [
    { key: 'vendorCode', header: 'Vendor Code', render: (r: Vendor) => <span className="font-mono">{r.vendorCode}</span> },
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type', render: (r: Vendor) => <Pill color={TYPE_COLOR[r.type] ?? 'var(--text-muted)'}>{typeLabel(r.type)}</Pill> },
    { key: 'contactPerson', header: 'Contact', render: (r: Vendor) => r.contactPerson ?? '—' },
    { key: 'contactNumber', header: 'Phone', render: (r: Vendor) => <span className="font-mono">{r.contactNumber ?? '—'}</span> },
    {
      key: 'credit', header: 'Credit due',
      render: (r: Vendor) => (r.outstandingCredit != null ? <span className="font-mono" style={{ color: r.outstandingCredit > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{inr(r.outstandingCredit)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>),
    },
    {
      key: 'isActive', header: 'Status',
      render: (r: Vendor) => (r.isActive ? <Pill color="var(--accent-teal)">Active</Pill> : <Pill color="var(--text-muted)" bg="var(--bg-sunken)" border="var(--border-strong)">Inactive</Pill>),
    },
    {
      key: 'actions', header: 'Actions',
      render: (r: Vendor) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="btn-ghost" onClick={() => openEdit(r)}>Edit</button>
          {canDelete(r.type) && <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setDelRow(r)}>Delete</button>}
        </div>
      ),
    },
  ];

  const label = (text: string) => <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{text}</label>;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Vendors"
        breadcrumbs={['Master Data', 'Vendors']}
        actions={<button className="btn-brand" onClick={() => openAdd()}>+ Add Vendor</button>}
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="flex gap-3 flex-wrap items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, code or contact…" />
        <select className="tv-input" style={{ width: 220 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types ({all.length})</option>
          {TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label} ({count(t.value)})</option>))}
        </select>
        <select className="tv-input" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyLabel="No vendors found" pageSize={10} />

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit Vendor' : 'Add Vendor'}
        footer={<LoadingButton className="btn-brand" loading={submitting} onClick={submit}>Save</LoadingButton>}
      >
        <div className="flex flex-col gap-3">
          <div>
            {label('Vendor type')}
            <select className="tv-input w-full" value={form.type} disabled={!!editing} onChange={(e) => set('type', e.target.value as ManagedVendorType)}>
              {TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </select>
            {editing && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-dim)' }}>The type can't be changed once a vendor is added.</div>}
          </div>
          <div>
            {label('Name')}
            <input className="tv-input w-full" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={`${typeLabel(form.type)} name`} />
          </div>
          <div>
            {label('Vendor Code')}
            <input className="tv-input w-full font-mono" value={form.vendorCode} onChange={(e) => set('vendorCode', e.target.value)} placeholder={editing ? '' : `Leave blank to generate (${TYPES.find((t) => t.value === form.type)?.prefix}-0001…)`} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              {label('Contact Person')}
              <input className="tv-input w-full" value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex-1">
              {label('Contact Number')}
              <input className="tv-input w-full font-mono" value={form.contactNumber} onChange={(e) => set('contactNumber', e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            {label('Notes')}
            <input className="tv-input w-full" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional" />
          </div>
          {editing && (
            <div className="flex items-center justify-between py-1">
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Active</span>
              <TVSwitch checked={form.isActive} onCheckedChange={(v: boolean) => set('isActive', v)} />
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!delRow}
        onOpenChange={(v: boolean) => { if (!v) setDelRow(null); }}
        title="Delete Vendor"
        footer={<LoadingButton className="btn-brand" loading={delBusy} onClick={confirmDelete} style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>Delete</LoadingButton>}
      >
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Delete <b>{delRow?.name}</b>? This can’t be undone. Job cards, slips and fuel logs referencing this vendor will keep their data but lose the vendor reference. To keep the history, mark the vendor Inactive instead.
        </div>
      </Modal>
    </div>
  );
}
