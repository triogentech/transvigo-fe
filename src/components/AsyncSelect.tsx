import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Search, ChevronDown, Check, Loader2 } from 'lucide-react';
import { getSelectPage, type SelectEntity, type SelectOption } from '../api/select.api';
import { errMessage } from '../api/client';

interface AsyncSelectProps {
  entity: SelectEntity;
  value: string;
  onChange: (value: string, option?: SelectOption) => void;
  placeholder?: string;
  /** Label for the current value when its option isn't in the loaded page (e.g. editing an existing record). */
  valueLabel?: string;
  pageSize?: number;
  status?: string;
  disabled?: boolean;
  /** Show a "none" row at the top of the list that resets the value to ''. */
  clearable?: boolean;
  clearLabel?: string;
  emptyLabel?: string;
  /**
   * Client-side mode: when provided, the combobox filters/paginates this
   * preloaded list in memory instead of hitting the paginated `/api/select`
   * endpoint. Use for entities whose backend doesn't support the paginated
   * path — you still get search-as-you-type + infinite scroll.
   */
  staticOptions?: SelectOption[];
}

/**
 * Searchable, infinitely-scrolling combobox backed by `/api/select/:entity`
 * (paginated). Debounces the search box, fetches one page at a time, and loads
 * the next page as the user scrolls near the bottom. Use for entities that can
 * grow too large for the plain (200-capped) `TVSelect`.
 */
export function AsyncSelect({
  entity,
  value,
  onChange,
  placeholder = 'Select…',
  valueLabel,
  pageSize = 25,
  status,
  disabled,
  clearable,
  clearLabel = 'None',
  emptyLabel = 'No results',
  staticOptions,
}: AsyncSelectProps) {
  const clientMode = staticOptions !== undefined;
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // When rendered inside a Radix Dialog (modal), its scroll-lock (RemoveScroll)
  // blocks wheel scrolling in content portaled to <body>. Portaling the popover
  // into the dialog element instead keeps the options list scrollable.
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Remembered label for the selected value so the trigger reads correctly even
  // when the chosen option scrolls out of / was never in the loaded list.
  const [selectedLabel, setSelectedLabel] = useState(valueLabel ?? '');
  useEffect(() => { if (valueLabel !== undefined) setSelectedLabel(valueLabel); }, [valueLabel]);
  useEffect(() => { if (!value) setSelectedLabel(''); }, [value]);

  // Debounce the search box (300ms).
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Guards against stale responses overwriting a newer search/page.
  const reqIdRef = useRef(0);

  const fetchPage = useCallback(async (pageNum: number, replace: boolean) => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await getSelectPage(entity, {
        search: debounced || undefined,
        page: pageNum,
        pageSize,
        status,
      });
      if (reqId !== reqIdRef.current) return; // superseded
      setOptions((prev) => (replace ? res.data : [...prev, ...res.data]));
      setHasMore(res.hasMore);
      setPage(pageNum);
    } catch (e) {
      if (reqId !== reqIdRef.current) return;
      setError(errMessage(e));
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [entity, debounced, pageSize, status]);

  // (Re)load the first page whenever the popover opens or the search changes.
  // Skipped entirely in client-side mode (no network).
  useEffect(() => {
    if (!open || clientMode) return;
    void fetchPage(1, true);
  }, [open, fetchPage, clientMode]);

  // ── Client-side mode: filter + incremental reveal over the preloaded list ──
  const filtered = useMemo(() => {
    if (!clientMode) return [];
    const q = debounced.trim().toLowerCase();
    return q ? staticOptions!.filter((o) => o.label.toLowerCase().includes(q)) : staticOptions!;
  }, [clientMode, staticOptions, debounced]);

  // Reset the reveal window when the search changes or the popover reopens.
  useEffect(() => {
    if (clientMode) setVisibleCount(pageSize);
  }, [clientMode, debounced, open, pageSize]);

  // Keep the trigger label in sync with the current value from the static list.
  useEffect(() => {
    if (clientMode && value) {
      const found = staticOptions!.find((o) => o.value === value);
      if (found && found.label !== selectedLabel) setSelectedLabel(found.label);
    }
  }, [clientMode, value, staticOptions, selectedLabel]);

  const displayOptions = clientMode ? filtered.slice(0, visibleCount) : options;
  const displayHasMore = clientMode ? filtered.length > visibleCount : hasMore;
  const displayLoading = clientMode ? false : loading;
  const displayError = clientMode ? null : error;

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!displayHasMore || displayLoading) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) {
      if (clientMode) setVisibleCount((c) => c + pageSize);
      else void fetchPage(page + 1, false);
    }
  };

  const choose = (opt?: SelectOption) => {
    onChange(opt?.value ?? '', opt);
    setSelectedLabel(opt?.label ?? '');
    setOpen(false);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) setPortalContainer((triggerRef.current?.closest('[role="dialog"]') as HTMLElement) ?? null);
    if (!o) setSearch('');
  };

  return (
    <Popover.Root open={open} onOpenChange={disabled ? undefined : handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          className="tv-input"
          disabled={disabled}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left' }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value && selectedLabel ? 'var(--text-primary)' : 'var(--text-dim)' }}>
            {value && selectedLabel ? selectedLabel : placeholder}
          </span>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </button>
      </Popover.Trigger>
      <Popover.Portal container={portalContainer ?? undefined}>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="tv-panel z-[70] overflow-hidden"
          style={{ width: 'var(--radix-popover-trigger-width)', padding: 0 }}
          onOpenAutoFocus={(e) => {
            // Keep the browser from scrolling the trigger; focus the search box instead.
            e.preventDefault();
            (e.currentTarget as HTMLElement).querySelector('input')?.focus();
          }}
        >
          {/* Search box */}
          <div style={{ position: 'relative', padding: 8, borderBottom: '1px solid var(--border)' }}>
            <Search size={14} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
            <input
              className="tv-input"
              style={{ paddingLeft: 30 }}
              value={search}
              placeholder="Search…"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Options list */}
          <div onScroll={onScroll} style={{ maxHeight: 260, overflowY: 'auto', padding: 4 }}>
            {clearable && (
              <Row selected={!value} onClick={() => choose(undefined)} label={clearLabel} muted />
            )}
            {displayOptions.map((o) => (
              <Row key={o.value} selected={o.value === value} onClick={() => choose(o)} label={o.label} />
            ))}

            {displayLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 8px', color: 'var(--text-muted)', fontSize: 12 }}>
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            )}
            {displayError && !displayLoading && (
              <div style={{ padding: '10px 8px', color: 'var(--danger)', fontSize: 12 }}>{displayError}</div>
            )}
            {!displayLoading && !displayError && displayOptions.length === 0 && (
              <div style={{ padding: '10px 8px', color: 'var(--text-dim)', fontSize: 12 }}>{emptyLabel}</div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Row({ label, selected, onClick, muted }: { label: string; selected: boolean; onClick: () => void; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 w-full rounded-sm"
      style={{ padding: '7px 8px', fontSize: 13, color: muted ? 'var(--text-muted)' : 'var(--text-primary)', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--navy-light)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {selected && <Check size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />}
    </button>
  );
}
