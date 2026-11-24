import React, { useMemo, useState } from 'react';
import { Check, Filter, X } from 'lucide-react';
import { Popover } from './ui.jsx';

export interface FilterOption { value: string; label: string }
export interface DateRange { from?: string; to?: string }
interface FilterProps {
  label: string;
  type?: 'text' | 'date' | 'select';
  // text / select: a string; date: { from, to }
  value: string | DateRange | undefined;
  onChange: (v: any) => void;
  options?: FilterOption[];
  placeholder?: string;
}

/**
 * A filter that lives in a table column header: a small funnel that turns teal (with a dot) while it is
 * active and opens a compact panel suited to the column.
 *
 *   type="text"   a "contains" box          value: string
 *   type="date"   a from / to day range     value: { from, to }
 *   type="select" a pick-list               value: string (the option value; '' = all)
 *
 * The page keeps the value; this only edits it. Text and dates are applied with Apply / Enter, a pick-list
 * applies as soon as you choose.
 */
export function ColumnFilter({ label, type = 'text', value, onChange, options = [], placeholder }: FilterProps) {
  const active = isActive(type, value);
  return (
    <Popover
      align="start"
      width={type === 'date' ? 330 : 250}
      trigger={
        <button
          type="button"
          aria-label={`Filter ${label}${active ? ' (active)' : ''}`}
          title={`Filter ${label}`}
          className="tv-colfilter"
          data-active={active ? 'true' : 'false'}
        >
          <Filter size={12} strokeWidth={2.2} />
        </button>
      }
    >
      <Panel label={label} type={type} value={value} onChange={onChange} options={options} placeholder={placeholder} />
    </Popover>
  );
}

function isActive(type: string, v: FilterProps['value']): boolean {
  if (type === 'date') { const r = v as DateRange | undefined; return !!(r && (r.from || r.to)); }
  return !!v;
}

const inputStyle = { width: '100%', minWidth: 0, fontSize: 13 };
const caption = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' };

function Panel({ label, type, value, onChange, options, placeholder }: Required<Pick<FilterProps, 'label' | 'type' | 'options'>> & Pick<FilterProps, 'value' | 'onChange' | 'placeholder'>) {
  const range = (value ?? {}) as DateRange;
  const [draft, setDraft] = useState<any>(type === 'date' ? { from: range.from ?? '', to: range.to ?? '' } : ((value as string) ?? ''));
  const [q, setQ] = useState('');
  const shown = useMemo(() => options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())), [options, q]);

  if (type === 'select') {
    return (
      <div className="flex flex-col gap-2">
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {options.length > 7 && (
          <input className="tv-input" style={inputStyle} autoFocus placeholder="Find…" value={q} onChange={(e) => setQ(e.target.value)} />
        )}
        <div role="listbox" aria-label={label} style={{ maxHeight: 240, overflowY: 'auto', margin: '0 -4px' }}>
          {[{ value: '', label: 'All' }, ...shown].map((o) => {
            const on = ((value as string) ?? '') === o.value;
            return (
              <button
                key={o.value || '__all'}
                type="button"
                role="option"
                aria-selected={on}
                className="tv-colfilter-opt"
                data-on={on ? 'true' : 'false'}
                onClick={() => onChange(o.value)}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{o.label}</span>
                {on && <Check size={13} />}
              </button>
            );
          })}
          {shown.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '6px 8px' }}>Nothing matches.</div>}
        </div>
      </div>
    );
  }

  const apply = () => onChange(type === 'date' ? { from: draft.from || '', to: draft.to || '' } : String(draft).trim());
  const clear = () => { setDraft(type === 'date' ? { from: '', to: '' } : ''); onChange(type === 'date' ? { from: '', to: '' } : ''); };
  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } };

  return (
    <div className="flex flex-col gap-2.5" onKeyDown={onKey}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      {type === 'date' ? (
        <div className="grid grid-cols-2 gap-2">
          <label><span style={caption}>From</span><input className="tv-input" style={inputStyle} type="date" value={draft.from} max={draft.to || undefined} onChange={(e) => setDraft((d: DateRange) => ({ ...d, from: e.target.value }))} /></label>
          <label><span style={caption}>To</span><input className="tv-input" style={inputStyle} type="date" value={draft.to} min={draft.from || undefined} onChange={(e) => setDraft((d: DateRange) => ({ ...d, to: e.target.value }))} /></label>
        </div>
      ) : (
        <input className="tv-input" style={inputStyle} autoFocus placeholder={placeholder ?? `${label} contains…`} value={draft} onChange={(e) => setDraft(e.target.value)} />
      )}
      <div className="flex justify-between items-center">
        <button type="button" className="btn-ghost px-2 py-1" style={{ fontSize: 12 }} onClick={clear}>Clear</button>
        <button type="button" className="btn-brand px-3 py-1" style={{ fontSize: 12 }} onClick={apply}>Apply</button>
      </div>
    </div>
  );
}

/**
 * The filters that are on, as removable chips with one "Clear all". Renders nothing when none are active.
 * chips: [{ key, label, value, onRemove }]
 */
export function ActiveFilters({ chips, onClearAll }: { chips: { key: string; label: string; value: string; onRemove: () => void }[]; onClearAll: () => void }) {
  if (!chips.length) return null;
  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Active filters">
      {chips.map((c) => (
        <span key={c.key} className="tv-chip">
          <span style={{ color: 'var(--text-muted)' }}>{c.label}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.value}</span>
          <button type="button" aria-label={`Remove filter ${c.label}`} onClick={c.onRemove} className="tv-chip-x"><X size={12} /></button>
        </span>
      ))}
      {chips.length > 1 && (
        <button type="button" className="btn-ghost px-2 py-1" style={{ fontSize: 12 }} onClick={onClearAll}>Clear all</button>
      )}
    </div>
  );
}

/** "5 Dec – 12 Dec", "from 5 Dec", "until 12 Dec" for a date chip. */
export function rangeLabel(r: DateRange): string {
  const f = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (r.from && r.to) return `${f(r.from)} – ${f(r.to)}`;
  return r.from ? `from ${f(r.from)}` : `until ${f(r.to as string)}`;
}
