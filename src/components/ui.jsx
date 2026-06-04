// ── SECTION: Shared UI Components ──
// Brand-styled wrappers around Radix primitives + table/card/badge helpers.
// Exports: Card, StatCard, AnimatedNumber, StatusBadge, Pill, PageHeader,
//   DataTable, Modal, TVSelect, TVSwitch, TVTooltip, TVAvatar, TVProgress,
//   SegmentTabs, Menu/MenuItem/MenuLabel/MenuSeparator, Popover, ConfirmDialog,
//   ToastProvider + useToast.

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Avatar from '@radix-ui/react-avatar';
import * as Progress from '@radix-ui/react-progress';
import * as Tabs from '@radix-ui/react-tabs';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as PopoverP from '@radix-ui/react-popover';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Toast from '@radix-ui/react-toast';
import {
  Check, ChevronDown, ChevronLeft, ChevronRight, Inbox, X,
} from 'lucide-react';
import { cx, initials } from '../lib/utils.js';

// ── Card ──
export function Card({ children, className = '', accent, accentGradient, streak, style }) {
  return (
    <div
      className={cx('tv-card relative', streak && 'motion-streak', className)}
      style={{
        ...(accent && { borderTop: `3px solid ${accent}` }),
        ...(accentGradient && { borderTop: '3px solid var(--accent-navy)' }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── AnimatedNumber (count-up via requestAnimationFrame) ──
export function AnimatedNumber({ value, format = (v) => Math.round(v).toString(), duration = 600, className, style }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className} style={style}>{format(n)}</span>;
}

// ── StatCard ──
export function StatCard({ title, children, sub, icon: Icon, accent = 'var(--teal)', accentGradient, streak, className }) {
  return (
    <Card accent={!accentGradient ? accent : undefined} accentGradient={accentGradient} streak={streak} className={cx('p-4 animate-fadeIn', className)}>
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-wider font-body" style={{ color: 'var(--text-muted)' }}>{title}</div>
        {Icon && <Icon size={18} style={{ color: accent }} />}
      </div>
      <div className="mt-2">{children}</div>
      {sub && <div className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </Card>
  );
}

// ── StatusBadge ──
const T = (k) => ({ bg: `var(--status-${k}-bg)`, color: `var(--status-${k}-text)`, border: `var(--status-${k}-border)` });
const NEUTRAL = { bg: 'var(--bg-sunken)', color: 'var(--text-secondary)', border: 'var(--border-strong)' };
const STATUS_MAP = {
  // trips
  created: { label: 'Created', ...T('info') },
  in_transit: { label: 'In Transit', ...T('warning'), dot: true },
  completed: { label: 'Completed', ...T('success') },
  cancelled: { label: 'Cancelled', ...T('danger') },
  // vehicles / drivers
  idle: { label: 'Idle', ...NEUTRAL },
  assigned: { label: 'Assigned', ...T('info') },
  available: { label: 'Available', ...T('success') },
  // transactions
  pending: { label: 'Pending', ...T('pending') },
  success: { label: 'Success', ...T('success') },
  failed: { label: 'Failed', ...T('danger') },
  // actions
  CREATE: { label: 'CREATE', ...T('success') },
  UPDATE: { label: 'UPDATE', ...T('warning') },
  DELETE: { label: 'DELETE', ...T('danger') },
};

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, ...NEUTRAL };
  return (
    <span
      className="inline-flex items-center gap-1.5 font-body font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, letterSpacing: '0.04em' }}
    >
      {s.dot && (
        <span className="inline-block rounded-full animate-pulse-dot" style={{ width: 5, height: 5, background: '#f59e0b' }} />
      )}
      {s.label}
    </span>
  );
}

// ── Pill (category tag). Pass {bg,text,border} for an exact neutral palette,
//    or just `color` for a tinted fallback. ──
export function Pill({ children, color = 'var(--accent-teal)', bg, text, border }) {
  return (
    <span
      className="inline-flex items-center font-body font-medium"
      style={{
        background: bg || `color-mix(in srgb, ${color} 12%, var(--bg-surface))`,
        color: text || color,
        border: `1px solid ${border || 'var(--border)'}`,
        borderRadius: 4, padding: '2px 8px', fontSize: 11,
      }}
    >
      {children}
    </span>
  );
}

// ── PageHeader ──
export function PageHeader({ title, breadcrumbs = [], actions }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="font-display font-bold" style={{ fontSize: 24, color: 'var(--text-primary)', lineHeight: 1.1 }}>{title}</h1>
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} />}
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── DataTable (sticky header, pagination, shimmer, empty state) ──
export function DataTable({ columns, data, onRowClick, rowClassName, emptyLabel = 'No records found', loading = false, pageSize: initialPageSize = 10, paginate = true }) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);
  const total = data.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const rows = paginate ? data.slice((safePage - 1) * pageSize, safePage * pageSize) : data;

  return (
    <div className="tv-card-flat overflow-hidden">
      <ScrollArea.Root className="w-full">
        <ScrollArea.Viewport className="w-full">
          <table className="w-full border-collapse" style={{ fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--navy-dark)' }}>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="px-3 py-2.5 font-body font-medium uppercase tracking-wide text-left"
                    style={{ color: 'var(--text-dim)', fontSize: 10.5, textAlign: c.align || 'left', borderBottom: '1px solid var(--border)', width: c.width }}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {columns.map((c) => (
                        <td key={c.key} className="px-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                          <div className="skeleton" style={{ height: 12, width: '70%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                ? (
                    <tr>
                      <td colSpan={columns.length}>
                        <div className="flex flex-col items-center justify-center gap-2 py-16" style={{ color: 'var(--text-dim)' }}>
                          <Inbox size={28} />
                          <span style={{ fontSize: 13 }}>{emptyLabel}</span>
                        </div>
                      </td>
                    </tr>
                  )
                : rows.map((row, ri) => (
                    <tr
                      key={row.id ?? ri}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cx('tv-row transition-colors', onRowClick && 'cursor-pointer', typeof rowClassName === 'function' ? rowClassName(row) : rowClassName)}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {columns.map((c) => (
                        <td key={c.key} className={cx('px-3 py-2.5', c.className)} style={{ textAlign: c.align || 'left', color: 'var(--text-primary)' }}>
                          {c.render ? c.render(row) : row[c.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="horizontal" className="flex h-2" style={{ background: 'var(--navy-dark)' }}>
          <ScrollArea.Thumb style={{ background: 'var(--navy-light)', borderRadius: 4 }} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      {paginate && !loading && total > 0 && (
        <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
            <span>Rows</span>
            <TVSelect
              value={String(pageSize)}
              onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
              options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }]}
              small
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }} className="font-mono">
            {total === 0 ? '0' : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, total)}`} of {total}
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-ghost p-1.5" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ opacity: safePage <= 1 ? 0.4 : 1 }}>
              <ChevronLeft size={15} />
            </button>
            <button className="btn-ghost p-1.5" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} style={{ opacity: safePage >= pageCount ? 0.4 : 1 }}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal (Radix Dialog) ──
export function Modal({ open, onOpenChange, trigger, title, header, children, footer, width = 560 }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="radix-overlay" />
        <Dialog.Content
          className="radix-content fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          style={{ width: `min(${width}px, calc(100vw - 32px))`, maxHeight: 'calc(100vh - 48px)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}
        >
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
            {header || <Dialog.Title className="font-display font-bold" style={{ fontSize: 18, color: 'var(--text-primary)' }}>{title}</Dialog.Title>}
            <Dialog.Close asChild>
              <button className="btn-ghost p-1" aria-label="Close"><X size={16} /></button>
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-5 py-4" style={{ flex: 1 }}>{children}</div>
          {footer && <div className="px-5 py-3.5 flex justify-end gap-2" style={{ borderTop: '1px solid var(--border)' }}>{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── TVSelect (Radix Select) ──
// Radix forbids an empty-string Item value, but callers use '' as a natural
// "All"/"None" sentinel. We transparently map '' ↔ EMPTY_SENTINEL internally so
// callers keep their existing '' semantics in `value` and `onValueChange`.
const EMPTY_SENTINEL = '__tv_empty__';
const toRadix = (v) => (v === '' ? EMPTY_SENTINEL : v);
const fromRadix = (v) => (v === EMPTY_SENTINEL ? '' : v);

export function TVSelect({ value, onValueChange, options, placeholder = 'Select…', small, disabled, className, renderValue }) {
  return (
    <Select.Root
      value={value === undefined ? undefined : toRadix(value)}
      onValueChange={onValueChange ? (v) => onValueChange(fromRadix(v)) : undefined}
      disabled={disabled}
    >
      <Select.Trigger
        className={cx('inline-flex items-center justify-between gap-2 btn-ghost', className)}
        style={{ padding: small ? '3px 8px' : '7px 10px', fontSize: small ? 12 : 13, color: 'var(--text-primary)', minWidth: small ? 56 : 140, fontFamily: 'var(--font-body)' }}
      >
        <Select.Value placeholder={placeholder}>{renderValue ? renderValue(value) : undefined}</Select.Value>
        <Select.Icon><ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="tv-panel z-[60] overflow-hidden" position="popper" sideOffset={4}>
          <Select.Viewport className="p-1">
            {options.map((o) => (
              <Select.Item
                key={String(o.value)}
                value={toRadix(o.value)}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer outline-none rounded-sm"
                style={{ fontSize: 13, color: 'var(--text-primary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--navy-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {o.dot && <span style={{ width: 8, height: 8, borderRadius: 99, background: o.dot, display: 'inline-block' }} />}
                <Select.ItemText>{o.label}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto"><Check size={13} style={{ color: 'var(--teal)' }} /></Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

// ── TVSwitch ──
export function TVSwitch({ checked, onCheckedChange, disabled }) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="relative rounded-full transition-colors"
      style={{ width: 34, height: 18, background: checked ? 'var(--accent-teal)' : 'var(--border-strong)', opacity: disabled ? 0.55 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <Switch.Thumb className="block rounded-full transition-transform" style={{ width: 14, height: 14, background: '#fff', transform: checked ? 'translateX(18px)' : 'translateX(2px)' }} />
    </Switch.Root>
  );
}

// ── TVTooltip ──
export function TVTooltip({ content, children, side = 'top' }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side={side} sideOffset={5} className="tv-panel z-[70] px-2.5 py-1.5" style={{ fontSize: 12, color: 'var(--text-primary)', maxWidth: 280 }}>
          {content}
          <Tooltip.Arrow style={{ fill: 'var(--navy-mid)' }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// ── TVAvatar ──
export function TVAvatar({ name, size = 32 }) {
  return (
    <Avatar.Root className="inline-flex items-center justify-center rounded-full overflow-hidden shrink-0" style={{ width: size, height: size, background: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)' }}>
      <Avatar.Fallback className="font-display font-semibold" style={{ color: 'var(--accent-navy)', fontSize: size * 0.4 }}>{initials(name)}</Avatar.Fallback>
    </Avatar.Root>
  );
}

// ── TVProgress ──
export function TVProgress({ value, color = 'var(--teal)', height = 6 }) {
  return (
    <Progress.Root className="relative overflow-hidden w-full" style={{ height, background: 'var(--navy-light)', borderRadius: 99 }} value={value}>
      <Progress.Indicator className="h-full transition-transform" style={{ width: `${value}%`, background: color, borderRadius: 99 }} />
    </Progress.Root>
  );
}

// ── SegmentTabs (status filter tabs) ──
export function SegmentTabs({ tabs, value, onValueChange }) {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange}>
      <Tabs.List className="flex items-center gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {tabs.map((t) => {
          const active = value === t.value;
          return (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              className="relative px-3 py-2 font-body transition-colors"
              style={{ fontSize: 13, color: active ? 'var(--teal)' : 'var(--text-muted)', borderBottom: active ? '2px solid var(--teal)' : '2px solid transparent', marginBottom: -1 }}
            >
              {t.label}
              {t.count != null && (
                <span className="ml-1.5 px-1.5 py-0.5 font-mono" style={{ fontSize: 10, borderRadius: 4, background: 'var(--navy-light)', color: active ? 'var(--teal)' : 'var(--text-muted)' }}>{t.count}</span>
              )}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
}

// ── Menu (Radix DropdownMenu) ──
export function Menu({ trigger, children, align = 'end' }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align={align} sideOffset={4} className="tv-panel z-[60] py-1 min-w-[180px]">
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
export function MenuItem({ children, onSelect, danger, icon: Icon, disabled }) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className="flex items-center gap-2 px-3 py-1.5 cursor-pointer outline-none"
      style={{ fontSize: 13, color: danger ? 'var(--danger)' : 'var(--text-primary)', opacity: disabled ? 0.4 : 1 }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'var(--navy-light)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {Icon && <Icon size={14} />}
      {children}
    </DropdownMenu.Item>
  );
}
export function MenuLabel({ children }) {
  return <DropdownMenu.Label className="px-3 py-1 uppercase tracking-wide" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{children}</DropdownMenu.Label>;
}
export function MenuSeparator() {
  return <DropdownMenu.Separator style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />;
}

// ── Popover ──
export function Popover({ trigger, children, align = 'end', width = 300 }) {
  return (
    <PopoverP.Root>
      <PopoverP.Trigger asChild>{trigger}</PopoverP.Trigger>
      <PopoverP.Portal>
        <PopoverP.Content align={align} sideOffset={6} className="tv-panel z-[60] p-3" style={{ width }}>
          {children}
        </PopoverP.Content>
      </PopoverP.Portal>
    </PopoverP.Root>
  );
}

// ── ConfirmDialog (Radix AlertDialog) ──
export function ConfirmDialog({ trigger, title, description, confirmLabel = 'Confirm', variant = 'default', onConfirm }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="radix-overlay" />
        <AlertDialog.Content className="radix-content fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] p-5" style={{ width: 'min(420px, calc(100vw - 32px))', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <AlertDialog.Title className="font-display font-bold" style={{ fontSize: 18, color: 'var(--text-primary)' }}>{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{description}</AlertDialog.Description>
          <div className="flex justify-end gap-2 mt-5">
            <AlertDialog.Cancel asChild><button className="btn-ghost px-3 py-1.5" style={{ fontSize: 13 }}>Cancel</button></AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className={variant === 'destructive' ? 'px-3 py-1.5' : 'btn-brand px-3 py-1.5'}
                style={variant === 'destructive' ? { fontSize: 13, background: 'var(--status-danger-bg)', color: 'var(--status-danger-text)', border: '1px solid var(--status-danger-border)', borderRadius: 8, fontWeight: 500 } : { fontSize: 13 }}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// ── Toast ──
const ToastCtx = createContext(() => {});
export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const push = (toast) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, ...toast }]);
  };
  return (
    <ToastCtx.Provider value={push}>
      <Toast.Provider swipeDirection="right" duration={3500}>
        {children}
        {toasts.map((t) => (
          <Toast.Root
            key={t.id}
            className="toast-root tv-panel flex items-center gap-3 px-4 py-3"
            onOpenChange={(open) => { if (!open) setToasts((arr) => arr.filter((x) => x.id !== t.id)); }}
            style={{ borderLeft: `3px solid ${t.color || 'var(--success)'}` }}
          >
            {t.icon}
            <div>
              <Toast.Title className="font-display font-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{t.title}</Toast.Title>
              {t.description && <Toast.Description style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.description}</Toast.Description>}
            </div>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-[100]" style={{ width: 340, maxWidth: '100vw' }} />
      </Toast.Provider>
    </ToastCtx.Provider>
  );
}
