import React, { useEffect, useMemo, useState } from 'react';
import { useSpareParts } from '../hooks/useSpareParts';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import { getSelect, type SelectOption } from '../api/select.api';
import { getIssueSlips, createIssueSlip } from '../api/spare-parts.api';
import type {
  CreateSparePartBody, SparePart, StockAdjustmentBody,
  SpareIssueSlip, CreateIssueSlipBody,
} from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';
import { SearchInput } from '../components/SearchInput';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const Pill: React.FC<any> = UI.Pill;

const inr = (v: string | number): string => `₹${Number(v).toLocaleString('en-IN')}`;
const num = (v: string | number): number => Number(v);

interface FormState {
  partNumber: string; partName: string; category: string;
  unitOfMeasure: string; currentStockQty: string; reorderLevel: string; unitCost: string;
}
const EMPTY_FORM: FormState = {
  partNumber: '', partName: '', category: '', unitOfMeasure: 'piece',
  currentStockQty: '', reorderLevel: '', unitCost: '',
};

interface AdjState { part: SparePart | null; adjustmentType: 'add' | 'remove'; qty: string; reason: string }
const EMPTY_ADJ: AdjState = { part: null, adjustmentType: 'add', qty: '', reason: '' };

interface SlipLine { partName: string; qty: string; cost: string }
interface SlipForm { vehicleId: string; jobCardId: string; garageId: string; vendorId: string; notes: string; lines: SlipLine[] }
const EMPTY_LINE: SlipLine = { partName: '', qty: '', cost: '' };
const EMPTY_SLIP: SlipForm = { vehicleId: '', jobCardId: '', garageId: '', vendorId: '', notes: '', lines: [{ ...EMPTY_LINE }] };

export default function SparePartsPage() {
  const { allParts, loading, error, refetch, createSparePart, adjustStock } = useSpareParts();
  const toast = useToast();

  const [tab, setTab] = useState<'catalog' | 'slips'>('catalog');

  // ── Catalog state ──
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [adj, setAdj] = useState<AdjState>(EMPTY_ADJ);
  const [adjBusy, setAdjBusy] = useState(false);

  // ── Issue-slip state ──
  const [slips, setSlips] = useState<SpareIssueSlip[]>([]);
  const [slipsLoading, setSlipsLoading] = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);
  const [slip, setSlip] = useState<SlipForm>(EMPTY_SLIP);
  const [slipBusy, setSlipBusy] = useState(false);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [jobCards, setJobCards] = useState<SelectOption[]>([]);
  const [garages, setGarages] = useState<SelectOption[]>([]);
  const [vendors, setVendors] = useState<SelectOption[]>([]);

  const loadSlips = async () => {
    setSlipsLoading(true);
    try { setSlips((await getIssueSlips()).data); }
    catch (e) { toast.error(errMessage(e)); }
    finally { setSlipsLoading(false); }
  };

  useEffect(() => {
    void getSelect('vehicles').then(setVehicles).catch(() => undefined);
    void getSelect('job-cards').then(setJobCards).catch(() => undefined);
    void getSelect('garages').then(setGarages).catch(() => undefined);
    void getSelect('spare-vendors').then(setVendors).catch(() => undefined);
  }, []);
  useEffect(() => { if (tab === 'slips') void loadSlips(); /* eslint-disable-next-line */ }, [tab]);

  const isLow = (p: SparePart) => num(p.currentStockQty) <= num(p.reorderLevel);

  const rows = useMemo(
    () =>
      (allParts as SparePart[]).filter(
        (p) =>
          matchesSearch(p, ['partNumber', 'partName', 'category'], search) &&
          (!lowOnly || isLow(p)),
      ),
    [allParts, search, lowOnly],
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setS = <K extends keyof SlipForm>(k: K, v: SlipForm[K]) => setSlip((s) => ({ ...s, [k]: v }));
  const setLine = (i: number, k: keyof SlipLine, v: string) =>
    setSlip((s) => ({ ...s, lines: s.lines.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)) }));
  const addLine = () => setSlip((s) => ({ ...s, lines: [...s.lines, { ...EMPTY_LINE }] }));
  const removeLine = (i: number) => setSlip((s) => ({ ...s, lines: s.lines.filter((_, idx) => idx !== i) }));

  const slipTotal = useMemo(
    () => slip.lines.reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.cost) || 0), 0),
    [slip.lines],
  );

  const submit = async () => {
    if (!form.partNumber.trim() || !form.partName.trim() || !form.category.trim())
      return toast.error('Part number, name and category are required');
    setSubmitting(true);
    try {
      const body: CreateSparePartBody = {
        partNumber: form.partNumber.trim(),
        partName: form.partName.trim(),
        category: form.category.trim(),
        unitOfMeasure: form.unitOfMeasure.trim() || 'piece',
        currentStockQty: form.currentStockQty ? Number(form.currentStockQty) : 0,
        reorderLevel: form.reorderLevel ? Number(form.reorderLevel) : 0,
        unitCost: form.unitCost ? Number(form.unitCost) : 0,
      };
      await createSparePart(body);
      toast.success('Spare part added');
      setOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const submitAdj = async () => {
    if (!adj.part) return;
    if (!adj.qty || Number(adj.qty) <= 0) return toast.error('Enter a positive quantity');
    if (!adj.reason.trim()) return toast.error('Enter a reason');
    setAdjBusy(true);
    try {
      const body: StockAdjustmentBody = { adjustmentType: adj.adjustmentType, qty: Number(adj.qty), reason: adj.reason.trim() };
      await adjustStock(adj.part.id, body);
      toast.success('Stock adjusted');
      setAdj(EMPTY_ADJ);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setAdjBusy(false);
    }
  };

  const submitSlip = async () => {
    if (!slip.vehicleId) return toast.error('Select a vehicle');
    const lines = slip.lines.filter((l) => l.partName.trim() && Number(l.qty) > 0);
    if (lines.length === 0) return toast.error('Add at least one part (name + quantity)');
    setSlipBusy(true);
    try {
      const body: CreateIssueSlipBody = {
        vehicleId: slip.vehicleId,
        jobCardId: slip.jobCardId || null,
        garageId: slip.garageId || null,
        vendorId: slip.vendorId || null,
        notes: slip.notes.trim() || null,
        items: lines.map((l) => ({ partName: l.partName.trim(), qtyIssued: Number(l.qty), unitCost: l.cost ? Number(l.cost) : 0 })),
      };
      const created = await createIssueSlip(body);
      toast.success(`Issue slip ${created.slipNumber} created`);
      setSlip(EMPTY_SLIP);
      setSlipOpen(false);
      await loadSlips();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSlipBusy(false);
    }
  };

  const columns = [
    { key: 'partNumber', header: 'Part #', render: (r: SparePart) => <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{r.partNumber}</span> },
    { key: 'partName', header: 'Name' },
    { key: 'category', header: 'Category' },
    {
      key: 'stock', header: 'In Stock',
      render: (r: SparePart) => (
        <span style={{ color: isLow(r) ? 'var(--danger, #DC2626)' : 'var(--text-primary)' }}>
          {num(r.currentStockQty)} {r.unitOfMeasure}
          {isLow(r) ? <Pill color="#DC2626" bg="var(--bg-sunken)"> Low</Pill> : null}
        </span>
      ),
    },
    { key: 'reorderLevel', header: 'Reorder At', render: (r: SparePart) => `${num(r.reorderLevel)}` },
    { key: 'unitCost', header: 'Unit Cost', render: (r: SparePart) => inr(r.unitCost) },
    { key: 'totalStockValue', header: 'Stock Value', render: (r: SparePart) => inr(r.totalStockValue) },
    {
      key: 'actions', header: 'Stock',
      render: (r: SparePart) => (
        <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); setAdj({ ...EMPTY_ADJ, part: r }); }}>Adjust</button>
      ),
    },
  ];

  const slipColumns = [
    { key: 'slipNumber', header: 'Slip No', render: (r: SpareIssueSlip) => <span className="font-mono" style={{ color: 'var(--teal)' }}>{r.slipNumber}</span> },
    { key: 'vehicle', header: 'Vehicle', render: (r: SpareIssueSlip) => r.vehicle?.vehicleNumber ?? '—' },
    { key: 'jobCard', header: 'Job Card', render: (r: SpareIssueSlip) => r.jobCard?.jobCardNumber ?? '—' },
    { key: 'garage', header: 'Garage', render: (r: SpareIssueSlip) => r.garage?.name ?? '—' },
    { key: 'parts', header: 'Parts', render: (r: SpareIssueSlip) => `${r.items?.length ?? 0} item(s)` },
    { key: 'totalSlipValue', header: 'Total', render: (r: SpareIssueSlip) => inr(r.totalSlipValue) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Spare Parts"
        breadcrumbs={['Workshop', 'Spare Parts']}
        actions={
          tab === 'catalog'
            ? <button className="btn-brand" onClick={() => { setForm(EMPTY_FORM); setOpen(true); }}>+ Add Part</button>
            : <button className="btn-brand" onClick={() => { setSlip(EMPTY_SLIP); setSlipOpen(true); }}>+ Issue Slip</button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['catalog', 'slips'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? 'btn-brand' : 'btn-ghost'}
            style={{ textTransform: 'capitalize' }}
          >
            {t === 'catalog' ? 'Parts Catalog' : 'Issue Slips'}
          </button>
        ))}
      </div>

      {tab === 'catalog' ? (
        <>
          <div className="flex gap-3 flex-wrap items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search part #, name, category…" />
            <label className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
              Below reorder only
            </label>
          </div>
          <DataTable columns={columns} data={rows} loading={loading} emptyLabel="No spare parts found" pageSize={12} />
        </>
      ) : (
        <DataTable columns={slipColumns} data={slips} loading={slipsLoading} emptyLabel="No issue slips yet" pageSize={12} />
      )}

      {/* Add part */}
      <Modal open={open} onOpenChange={setOpen} title="Add Spare Part"
        footer={<LoadingButton className="btn-brand" loading={submitting} onClick={submit}>Save</LoadingButton>}>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Field label="Part Number *"><input className="tv-input w-full" value={form.partNumber} onChange={(e) => set('partNumber', e.target.value)} /></Field>
            <Field label="Category *"><input className="tv-input w-full" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Brakes" /></Field>
          </div>
          <Field label="Part Name *"><input className="tv-input w-full" value={form.partName} onChange={(e) => set('partName', e.target.value)} /></Field>
          <div className="flex gap-3">
            <Field label="Unit"><input className="tv-input w-full" value={form.unitOfMeasure} onChange={(e) => set('unitOfMeasure', e.target.value)} /></Field>
            <Field label="Opening Stock"><input className="tv-input w-full" type="number" value={form.currentStockQty} onChange={(e) => set('currentStockQty', e.target.value)} placeholder="0" /></Field>
          </div>
          <div className="flex gap-3">
            <Field label="Reorder Level"><input className="tv-input w-full" type="number" value={form.reorderLevel} onChange={(e) => set('reorderLevel', e.target.value)} placeholder="0" /></Field>
            <Field label="Unit Cost (₹)"><input className="tv-input w-full" type="number" value={form.unitCost} onChange={(e) => set('unitCost', e.target.value)} placeholder="0" /></Field>
          </div>
        </div>
      </Modal>

      {/* Stock adjustment */}
      <Modal open={!!adj.part} onOpenChange={(v: boolean) => { if (!v) setAdj(EMPTY_ADJ); }}
        title={adj.part ? `Adjust Stock — ${adj.part.partName}` : 'Adjust Stock'}
        footer={<LoadingButton className="btn-brand" loading={adjBusy} onClick={submitAdj}>Apply</LoadingButton>}>
        <div className="flex flex-col gap-3">
          <Field label="Adjustment">
            <select className="tv-input w-full" value={adj.adjustmentType} onChange={(e) => setAdj((a) => ({ ...a, adjustmentType: e.target.value as 'add' | 'remove' }))}>
              <option value="add">Add stock (received)</option>
              <option value="remove">Remove stock (issued/scrapped)</option>
            </select>
          </Field>
          <Field label="Quantity"><input className="tv-input w-full" type="number" value={adj.qty} onChange={(e) => setAdj((a) => ({ ...a, qty: e.target.value }))} /></Field>
          <Field label="Reason"><input className="tv-input w-full" value={adj.reason} onChange={(e) => setAdj((a) => ({ ...a, reason: e.target.value }))} placeholder="e.g. PO-1023 received" /></Field>
        </div>
      </Modal>

      {/* Issue slip */}
      <Modal open={slipOpen} onOpenChange={(v: boolean) => { setSlipOpen(v); if (!v) setSlip(EMPTY_SLIP); }}
        title="New Spare-Part Issue Slip"
        footer={<LoadingButton className="btn-brand" loading={slipBusy} onClick={submitSlip}>Create Slip</LoadingButton>}>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Field label="Vehicle *">
              <select className="tv-input w-full" value={slip.vehicleId} onChange={(e) => setS('vehicleId', e.target.value)}>
                <option value="">— select —</option>
                {vehicles.map((v) => (<option key={v.value} value={v.value}>{v.label}</option>))}
              </select>
            </Field>
            <Field label="Job Card">
              <select className="tv-input w-full" value={slip.jobCardId} onChange={(e) => setS('jobCardId', e.target.value)}>
                <option value="">— none —</option>
                {jobCards.map((j) => (<option key={j.value} value={j.value}>{j.label}</option>))}
              </select>
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Garage">
              <select className="tv-input w-full" value={slip.garageId} onChange={(e) => setS('garageId', e.target.value)}>
                <option value="">— none —</option>
                {garages.map((g) => (<option key={g.value} value={g.value}>{g.label}</option>))}
              </select>
            </Field>
            <Field label="Vendor">
              <select className="tv-input w-full" value={slip.vendorId} onChange={(e) => setS('vendorId', e.target.value)}>
                <option value="">— none —</option>
                {vendors.map((v) => (<option key={v.value} value={v.value}>{v.label}</option>))}
              </select>
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Parts</label>
              <button className="btn-ghost" onClick={addLine} style={{ fontSize: 12 }}>+ Add part</button>
            </div>
            <div className="flex flex-col gap-2">
              {slip.lines.map((l, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input className="tv-input" style={{ flex: 2 }} placeholder="Part name" value={l.partName} onChange={(e) => setLine(i, 'partName', e.target.value)} />
                  <input className="tv-input" style={{ flex: 1 }} type="number" placeholder="Qty" value={l.qty} onChange={(e) => setLine(i, 'qty', e.target.value)} />
                  <input className="tv-input" style={{ flex: 1 }} type="number" placeholder="Cost ₹" value={l.cost} onChange={(e) => setLine(i, 'cost', e.target.value)} />
                  <button className="btn-ghost" onClick={() => removeLine(i)} disabled={slip.lines.length === 1} style={{ color: 'var(--danger)' }}>✕</button>
                </div>
              ))}
            </div>
            <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Total: {inr(slipTotal)}</div>
          </div>

          <Field label="Notes"><input className="tv-input w-full" value={slip.notes} onChange={(e) => setS('notes', e.target.value)} placeholder="Remarks" /></Field>
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
