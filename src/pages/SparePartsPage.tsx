import React, { useMemo, useState } from 'react';
import { useSpareParts } from '../hooks/useSpareParts';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { matchesSearch } from '../lib/clientList';
import type { CreateSparePartBody, SparePart, StockAdjustmentBody } from '../types/api.types';
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

export default function SparePartsPage() {
  const { allParts, loading, error, refetch, createSparePart, adjustStock } = useSpareParts();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [adj, setAdj] = useState<AdjState>(EMPTY_ADJ);
  const [adjBusy, setAdjBusy] = useState(false);

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
      const body: StockAdjustmentBody = {
        adjustmentType: adj.adjustmentType,
        qty: Number(adj.qty),
        reason: adj.reason.trim(),
      };
      await adjustStock(adj.part.id, body);
      toast.success('Stock adjusted');
      setAdj(EMPTY_ADJ);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setAdjBusy(false);
    }
  };

  const columns = [
    { key: 'partNumber', header: 'Part #', render: (r: SparePart) => <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>{r.partNumber}</span> },
    { key: 'partName', header: 'Name' },
    { key: 'category', header: 'Category' },
    {
      key: 'stock',
      header: 'In Stock',
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
      key: 'actions',
      header: 'Stock',
      render: (r: SparePart) => (
        <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); setAdj({ ...EMPTY_ADJ, part: r }); }}>
          Adjust
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Spare Parts"
        breadcrumbs={['Workshop', 'Spare Parts']}
        actions={<button className="btn-brand" onClick={() => { setForm(EMPTY_FORM); setOpen(true); }}>+ Add Part</button>}
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <div className="flex gap-3 flex-wrap items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search part #, name, category…" />
        <label className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Below reorder only
        </label>
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyLabel="No spare parts found" pageSize={12} />

      {/* Add part */}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add Spare Part"
        footer={<LoadingButton className="btn-brand" loading={submitting} onClick={submit}>Save</LoadingButton>}
      >
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
      <Modal
        open={!!adj.part}
        onOpenChange={(v: boolean) => { if (!v) setAdj(EMPTY_ADJ); }}
        title={adj.part ? `Adjust Stock — ${adj.part.partName}` : 'Adjust Stock'}
        footer={<LoadingButton className="btn-brand" loading={adjBusy} onClick={submitAdj}>Apply</LoadingButton>}
      >
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
