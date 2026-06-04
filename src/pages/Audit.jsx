// API CALLS: 1 (GET /api/pages/audit-log)
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileSearch } from 'lucide-react';
import {
  Card,
  PageHeader,
  TVSelect,
  TVTooltip,
  TVAvatar,
  StatusBadge,
  Pill,
} from '../components/ui.jsx';
import { SkeletonTable, ErrorBanner } from '../components/states.tsx';
import { dateTime, relTime } from '../lib/utils.js';
import { useAuditLogPage } from '../hooks/pages/useAuditLogPage';

// ── JSON value colorizer ──
function renderVal(v) {
  if (v === null || v === undefined) {
    return <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>null</span>;
  }
  if (typeof v === 'boolean') {
    return <span style={{ color: v ? 'var(--success)' : 'var(--danger)' }}>{String(v)}</span>;
  }
  if (typeof v === 'number') {
    return <span style={{ color: 'var(--warning)' }}>{v}</span>;
  }
  // string
  return <span style={{ color: 'var(--green-light)' }}>"{v}"</span>;
}

// ── Diff panel: shows before or after fields ──
function DiffPanel({ side, changes }) {
  const isBefore = side === 'before';
  const bg = isBefore ? 'rgba(232,57,77,0.08)' : 'rgba(92,184,92,0.08)';
  const labelColor = isBefore ? 'var(--danger)' : 'var(--success)';
  const label = isBefore ? 'BEFORE' : 'AFTER';

  const fields = Object.entries(changes);

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${isBefore ? 'rgba(232,57,77,0.2)' : 'rgba(92,184,92,0.2)'}`,
        borderRadius: 4,
        padding: '10px 12px',
      }}
    >
      <div
        className="font-display font-semibold uppercase mb-2"
        style={{ fontSize: 10, letterSpacing: '0.08em', color: labelColor }}
      >
        {label}
      </div>
      <div className="flex flex-col gap-1">
        {fields.map(([field, change]) => {
          const val = isBefore ? change.before : change.after;
          const isNull = val === null || val === undefined;

          if (isBefore) {
            // Before panel — skip if before is null (added field)
            if (isNull) {
              return null;
            }
            // If after is null — this field was removed: show strikethrough
            const removed = change.after === null;
            return (
              <div key={field} className="font-mono flex items-center gap-1.5" style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--teal)' }}>{field}</span>
                <span style={{ color: 'var(--text-dim)' }}>:</span>
                <span style={removed ? { textDecoration: 'line-through', color: 'var(--danger)', opacity: 0.75 } : {}}>
                  {renderVal(val)}
                </span>
                {removed && (
                  <span
                    className="font-display font-semibold uppercase ml-1"
                    style={{ fontSize: 9, background: 'rgba(232,57,77,0.2)', color: 'var(--danger)', padding: '1px 4px', borderRadius: 3 }}
                  >
                    Removed
                  </span>
                )}
              </div>
            );
          } else {
            // After panel — skip if after is null (deleted field)
            if (isNull) {
              return null;
            }
            // If before is null — this field was added
            const added = change.before === null;
            return (
              <div key={field} className="font-mono flex items-center gap-1.5" style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--teal)' }}>{field}</span>
                <span style={{ color: 'var(--text-dim)' }}>:</span>
                {renderVal(val)}
                {added && (
                  <span
                    className="font-display font-semibold uppercase ml-1"
                    style={{ fontSize: 9, background: 'rgba(92,184,92,0.2)', color: 'var(--success)', padding: '1px 4px', borderRadius: 3 }}
                  >
                    Added
                  </span>
                )}
              </div>
            );
          }
        })}
        {/* If the panel has nothing to show, render a placeholder */}
        {fields.every(([, change]) => {
          const val = isBefore ? change.before : change.after;
          return val === null || val === undefined;
        }) && (
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
            {isBefore ? '— no previous values —' : '— no new values —'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Audit() {
  const { logs, meta, filterOptions, loading, error, filters, setFilters, refetch } = useAuditLogPage();

  // ── Expanded row ──
  const [expandedId, setExpandedId] = useState(null);

  const toggleRow = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ── Select options built from filterOptions (server-side) ──
  const actionOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'CREATE', label: 'CREATE' },
    { value: 'UPDATE', label: 'UPDATE' },
    { value: 'DELETE', label: 'DELETE' },
  ];

  const collectionOptions = [
    { value: 'all', label: 'All Collections' },
    ...(filterOptions?.collections ?? []).map((c) => ({ value: c, label: c })),
  ];

  const userOptions = [
    { value: 'all', label: 'All Users' },
    ...(filterOptions?.users ?? []).map((u) => ({ value: u.value, label: u.label })),
  ];

  const COL_COUNT = 7; // chevron + ts + user + action + collection + recordId + note

  // Helpers for filter active check
  const hasActiveFilter = filters.action || filters.collection || filters.performedBy || filters.dateFrom || filters.dateTo;

  if (loading) {
    return (
      <div className="flex flex-col gap-5 animate-fadeIn">
        <PageHeader title="AUDIT LOG" breadcrumbs={['Admin', 'Audit Log']} />
        <SkeletonTable rows={8} cols={7} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5 animate-fadeIn">
        <PageHeader title="AUDIT LOG" breadcrumbs={['Admin', 'Audit Log']} />
        <ErrorBanner message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      {/* 1. Page Header */}
      <PageHeader
        title="AUDIT LOG"
        breadcrumbs={['Admin', 'Audit Log']}
        actions={
          <div className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)', fontSize: 12 }}>
            <FileSearch size={15} style={{ color: 'var(--teal)' }} />
            <span className="font-mono">{meta.total}</span>
            <span>entries</span>
          </div>
        }
      />

      {/* 2. Filter bar */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Action type */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
              Action
            </label>
            <TVSelect
              value={filters.action ?? 'all'}
              onValueChange={(v) => setFilters({ action: v === 'all' ? undefined : v, page: 1 })}
              options={actionOptions}
              placeholder="All Actions"
            />
          </div>

          {/* Collection */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
              Collection
            </label>
            <TVSelect
              value={filters.collection ?? 'all'}
              onValueChange={(v) => setFilters({ collection: v === 'all' ? undefined : v, page: 1 })}
              options={collectionOptions}
              placeholder="All Collections"
            />
          </div>

          {/* User */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
              User
            </label>
            <TVSelect
              value={filters.performedBy ?? 'all'}
              onValueChange={(v) => setFilters({ performedBy: v === 'all' ? undefined : v, page: 1 })}
              options={userOptions}
              placeholder="All Users"
            />
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
              From
            </label>
            <input
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(e) => setFilters({ dateFrom: e.target.value || undefined, page: 1 })}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 4,
                color: 'var(--text-primary)',
                fontSize: 13,
                padding: '7px 10px',
                fontFamily: 'var(--font-body)',
                colorScheme: 'dark',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border-hover)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}>
              To
            </label>
            <input
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(e) => setFilters({ dateTo: e.target.value || undefined, page: 1 })}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 4,
                color: 'var(--text-primary)',
                fontSize: 13,
                padding: '7px 10px',
                fontFamily: 'var(--font-body)',
                colorScheme: 'dark',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border-hover)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Reset filters — only show if any filter is active */}
          {hasActiveFilter && (
            <button
              className="btn-ghost px-3"
              style={{ fontSize: 12, height: 34, alignSelf: 'flex-end' }}
              onClick={() => setFilters({ action: undefined, collection: undefined, performedBy: undefined, dateFrom: undefined, dateTo: undefined, page: 1 })}
            >
              Reset
            </button>
          )}
        </div>
      </Card>

      {/* 3. Audit table */}
      <div className="tv-card-flat overflow-hidden">
        <table className="w-full border-collapse" style={{ fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--navy-dark)' }}>
              {/* Chevron */}
              <th style={{ width: 36, borderBottom: '1px solid var(--border)', padding: '8px 6px' }} />
              <th
                className="font-body font-medium uppercase tracking-wide text-left px-3 py-2.5"
                style={{ color: 'var(--text-dim)', fontSize: 10.5, borderBottom: '1px solid var(--border)', width: 160 }}
              >
                Timestamp
              </th>
              <th
                className="font-body font-medium uppercase tracking-wide text-left px-3 py-2.5"
                style={{ color: 'var(--text-dim)', fontSize: 10.5, borderBottom: '1px solid var(--border)', width: 160 }}
              >
                User
              </th>
              <th
                className="font-body font-medium uppercase tracking-wide text-left px-3 py-2.5"
                style={{ color: 'var(--text-dim)', fontSize: 10.5, borderBottom: '1px solid var(--border)', width: 100 }}
              >
                Action
              </th>
              <th
                className="font-body font-medium uppercase tracking-wide text-left px-3 py-2.5"
                style={{ color: 'var(--text-dim)', fontSize: 10.5, borderBottom: '1px solid var(--border)', width: 130 }}
              >
                Collection
              </th>
              <th
                className="font-body font-medium uppercase tracking-wide text-left px-3 py-2.5"
                style={{ color: 'var(--text-dim)', fontSize: 10.5, borderBottom: '1px solid var(--border)', width: 140 }}
              >
                Record ID
              </th>
              <th
                className="font-body font-medium uppercase tracking-wide text-left px-3 py-2.5"
                style={{ color: 'var(--text-dim)', fontSize: 10.5, borderBottom: '1px solid var(--border)' }}
              >
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT}>
                  <div
                    className="flex flex-col items-center justify-center gap-2 py-16"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    <FileSearch size={28} />
                    <span style={{ fontSize: 13 }}>No audit entries match the current filters</span>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedId === log.id;
                const username = log.performedByUser?.username ?? '—';
                return (
                  <React.Fragment key={log.id}>
                    {/* Main row */}
                    <tr
                      onClick={() => toggleRow(log.id)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border)' }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = 'rgba(14,165,197,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Chevron */}
                      <td style={{ padding: '8px 6px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            transition: 'transform 150ms ease',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          }}
                        >
                          <ChevronRight size={14} />
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="px-3 py-2.5">
                        <TVTooltip content={<span className="font-mono" style={{ fontSize: 11 }}>{relTime(log.createdAt)}</span>} side="right">
                          <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)', cursor: 'default' }}>
                            {dateTime(log.createdAt)}
                          </span>
                        </TVTooltip>
                      </td>

                      {/* User */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {log.performedByUser && <TVAvatar name={username} size={24} />}
                          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{username}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-3 py-2.5">
                        <StatusBadge status={log.action} />
                      </td>

                      {/* Collection */}
                      <td className="px-3 py-2.5">
                        <Pill color="var(--teal)">
                          <span className="font-mono">{log.collection}</span>
                        </Pill>
                      </td>

                      {/* Record ID */}
                      <td className="px-3 py-2.5" style={{ maxWidth: 140 }}>
                        <span
                          className="font-mono"
                          style={{
                            fontSize: 11,
                            color: 'var(--text-dim)',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={log.recordId}
                        >
                          {log.recordId}
                        </span>
                      </td>

                      {/* Note */}
                      <td className="px-3 py-2.5" style={{ maxWidth: 220 }}>
                        <TVTooltip content={log.note} side="left">
                          <span
                            style={{
                              fontSize: 13,
                              color: 'var(--text-muted)',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              cursor: 'default',
                            }}
                          >
                            {log.note}
                          </span>
                        </TVTooltip>
                      </td>
                    </tr>

                    {/* Expanded diff row */}
                    {isExpanded && (
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={COL_COUNT} style={{ padding: '0 12px 12px 12px', background: 'rgba(14,165,197,0.03)' }}>
                          {/* Header */}
                          <div
                            className="flex items-center gap-2 py-2 mb-2"
                            style={{ borderBottom: '1px solid var(--border)' }}
                          >
                            <ChevronDown size={13} style={{ color: 'var(--teal)' }} />
                            <span
                              className="font-display font-semibold uppercase"
                              style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.07em' }}
                            >
                              Changes diff —&nbsp;
                            </span>
                            <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                              {log.recordId}
                            </span>
                            <span
                              className="font-mono ml-auto"
                              style={{ fontSize: 11, color: 'var(--text-dim)' }}
                            >
                              {Object.keys(log.changes).length} field{Object.keys(log.changes).length !== 1 ? 's' : ''} changed
                            </span>
                          </div>

                          {/* Before / After grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <DiffPanel side="before" changes={log.changes} />
                            <DiffPanel side="after" changes={log.changes} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
