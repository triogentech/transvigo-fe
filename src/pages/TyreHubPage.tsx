import React, { useEffect, useMemo, useState } from 'react';
import { useTyres } from '../hooks/useTyres';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import { getSelect, type SelectOption } from '../api/select.api';
import type { CreateTyreBody, CreateTyreMovementBody, Tyre, TyreMovementType, TyreStatus } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';
import { SearchInput } from '../components/SearchInput';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const Pill: React.FC<any> = UI.Pill;

const STATUS_META: Record<TyreStatus, { label: string; color: string }> = {
  in_stock: { label: 'In Stock', color: 'var(--accent-teal)' },
  in_use: { label: 'In Use', color: '#16A34A' },
  retreading: { label: 'Retreading', color: '#D97706' },
  scrapped: { label: 'Scrapped', color: 'var(--text-muted)' },
};

const MOVEMENTS: { value: TyreMovementType; label: string }[] = [
  { value: 'fitted', label: 'Fit to vehicle' },
  { value: 'removed', label: 'Remove from vehicle' },
  { value: 'scrapped', label: 'Scrap' },
  { value: 'sent_for_retread', label: 'Send for retread' },
  { value: 'returned_from_retread', label: 'Return from retread' },
  { value: 'returned_to_stock', label: 'Return to stock' },
];

const healthColor = (pct: number): string => (pct >= 50 ? '#16A34A' : pct >= 20 ? '#D97706' : '#DC2626');

interface FormState { serialNumber: string; brand: string; size: string; tyreType: 'new_tyre' | 'retread'; purchaseCost: string; expectedLifeKm: string }
const EMPTY_FORM: FormState = { serialNumber: '', brand: '', size: '', tyreType: 'new_tyre', purchaseCost: '', expectedLifeKm: '80000' };

interface MoveState { tyre: Tyre | null; movementType: TyreMovementType; vehicleId: string; position: string; odometerAtEvent: string }
const EMPTY_MOVE: MoveState = { tyre: null, movementType: 'fitted', vehicleId: '', position: '', odometerAtEvent: '' };

export default function TyreHubPage() {
  const { allTyres, loading, error, refetch, createTyre, addMovement } = useTyres();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [move, setMove] = useState<MoveState>(EMPTY_MOVE);
  const [moveBusy, setMoveBusy] = useState(false);

  useEffect(() => {
    void getSelect('vehicles').then(setVehicles).catch(() => undefined);
  }, []);

  const rows = useMemo(
    () =>
      (allTyres as Tyre[]).filter(
        (t) =>
          matchesSearch(t, ['serialNumber', 'brand', 'size'], search) &&
          (!statusFilter || t.currentStatus === statusFilter),
      ),
    [allTyres, search, statusFilter],
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.serialNumber.trim() || !form.brand.trim() || !form.size.trim())
      return toast.error('Serial, brand and size are required');
    setSubmitting(true);
    try {
      const body: CreateTyreBody = {
        serialNumber: form.serialNumber.trim(),
        brand: form.brand.trim(),
        size: form.size.trim(),
        tyreType: form.tyreType,
        purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : null,
        expectedLifeKm: form.expectedLifeKm ? Number(form.expectedLifeKm) : 80000,
      };
      await createTyre(body);
      toast.success('Tyre registered');
      setOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const submitMove = async () => {
    if (!move.tyre) return;
    setMoveBusy(true);
    try {
      const body: CreateTyreMovementBody = {
        movementType: move.movementType,
        vehicleId: move.vehicleId || null,
        position: move.position || null,
        odometerAtEvent: move.odometerAtEvent ? Number(move.odometerAtEvent) : 0,
      };
      await addMovement(move.tyre.id, body);
      toast.success('Movement recorded');
      setMove(EMPTY_MOVE);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setMoveBusy(false);
    }
  };

  const columns = [
    { key: 'serialNumber', header: 'Serial', render: (r: Tyre) => <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{r.serialNumber}</span> },
    { key: 'brand', header: 'Brand' },
    { key: 'size', header: 'Size' },
    { key: 'currentStatus', header: 'Status', render: (r: Tyre) => <Pill color={STATUS_META[r.currentStatus].color}>{STATUS_META[r.currentStatus].label}</Pill> },
    { key: 'currentVehicle', header: 'On Vehicle', render: (r: Tyre) => r.currentVehicle?.vehicleNumber ?? (r.currentPosition ? `(${r.currentPosition})` : '—') },
    {
      key: 'health',
      header: 'Health / Wear',
      render: (r: Tyre) => (
        <div style={{ minWidth: 120 }}>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-sunken)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(0, Math.min(100, r.healthPct))}%`, height: '100%', background: healthColor(r.healthPct) }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {r.healthPct}% · {r.totalKmRun.toLocaleString('en-IN')}/{r.expectedLifeKm.toLocaleString('en-IN')} km
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Move',
      render: (r: Tyre) => (
        <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); setMove({ ...EMPTY_MOVE, tyre: r, odometerAtEvent: String(r.totalKmRun || '') }); }}>
          IN / OUT
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Tyre Hub"
        breadcrumbs={['Workshop', 'Tyre Hub']}
        actions={<button className="btn-brand" onClick={() => { setForm(EMPTY_FORM); setOpen(true); }}>+ Register Tyre</button>}
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <div className="flex gap-3 flex-wrap items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search serial, brand, size…" />
        <select className="tv-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {(Object.keys(STATUS_META) as TyreStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyLabel="No tyres found" pageSize={12} />

      {/* Register tyre */}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Register Tyre"
        footer={<LoadingButton className="btn-brand" loading={submitting} onClick={submit}>Save</LoadingButton>}
      >
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Field label="Serial Number *"><input className="tv-input w-full" value={form.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} /></Field>
            <Field label="Type">
              <select className="tv-input w-full" value={form.tyreType} onChange={(e) => set('tyreType', e.target.value as 'new_tyre' | 'retread')}>
                <option value="new_tyre">New</option>
                <option value="retread">Retread</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Brand *"><input className="tv-input w-full" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="MRF / CEAT / JK" /></Field>
            <Field label="Size *"><input className="tv-input w-full" value={form.size} onChange={(e) => set('size', e.target.value)} placeholder="10.00 R20" /></Field>
          </div>
          <div className="flex gap-3">
            <Field label="Purchase Cost (₹)"><input className="tv-input w-full" type="number" value={form.purchaseCost} onChange={(e) => set('purchaseCost', e.target.value)} /></Field>
            <Field label="Expected Life (km)"><input className="tv-input w-full" type="number" value={form.expectedLifeKm} onChange={(e) => set('expectedLifeKm', e.target.value)} /></Field>
          </div>
        </div>
      </Modal>

      {/* Movement */}
      <Modal
        open={!!move.tyre}
        onOpenChange={(v: boolean) => { if (!v) setMove(EMPTY_MOVE); }}
        title={move.tyre ? `Tyre Movement — ${move.tyre.serialNumber}` : 'Tyre Movement'}
        footer={<LoadingButton className="btn-brand" loading={moveBusy} onClick={submitMove}>Record</LoadingButton>}
      >
        <div className="flex flex-col gap-3">
          <Field label="Movement">
            <select className="tv-input w-full" value={move.movementType} onChange={(e) => setMove((m) => ({ ...m, movementType: e.target.value as TyreMovementType }))}>
              {MOVEMENTS.map((mv) => (
                <option key={mv.value} value={mv.value}>{mv.label}</option>
              ))}
            </select>
          </Field>
          <div className="flex gap-3">
            <Field label="Vehicle">
              <select className="tv-input w-full" value={move.vehicleId} onChange={(e) => setMove((m) => ({ ...m, vehicleId: e.target.value }))}>
                <option value="">— none —</option>
                {vehicles.map((v) => (<option key={v.value} value={v.value}>{v.label}</option>))}
              </select>
            </Field>
            <Field label="Position"><input className="tv-input w-full" value={move.position} onChange={(e) => setMove((m) => ({ ...m, position: e.target.value }))} placeholder="FL / RL1 …" /></Field>
          </div>
          <Field label="Odometer at event (km)"><input className="tv-input w-full" type="number" value={move.odometerAtEvent} onChange={(e) => setMove((m) => ({ ...m, odometerAtEvent: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}
