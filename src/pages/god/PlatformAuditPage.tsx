import React, { useState } from 'react';
import { usePlatformAudit } from '../../hooks/god/usePlatformAudit';
import { SkeletonTable, EmptyState, ErrorBanner } from '../../components/states';
import { dateTime } from '../../lib/utils.js';
import type { PlatformAuditEntry } from '../../types/god.types';

import {
  PageHeader as _PageHeader,
  DataTable as _DataTable,
  TVSelect as _TVSelect,
  TVTooltip as _TVTooltip,
} from '../../components/ui.jsx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PageHeader = _PageHeader as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataTable = _DataTable as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TVSelect = _TVSelect as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TVTooltip = _TVTooltip as React.FC<any>;

// ── Action color coding ────────────────────────────────────────────────
function actionColor(action: string): string {
  const upper = action.toUpperCase();
  if (upper.endsWith('_CREATED')) return '#4ade80';
  if (upper.endsWith('_SUSPENDED') || upper.endsWith('_STARTED')) return '#f59e0b';
  if (upper.endsWith('_DELETED') || upper.endsWith('_REJECTED')) return '#f87171';
  return 'var(--text-secondary)';
}

// ── Target types ───────────────────────────────────────────────────────
const TARGET_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'platform_admin', label: 'Platform Admin' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'onboarding_request', label: 'Onboarding Request' },
];

// Common action options for the action filter select
const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'ORG_CREATED', label: 'ORG_CREATED' },
  { value: 'ORG_UPDATED', label: 'ORG_UPDATED' },
  { value: 'ORG_SUSPENDED', label: 'ORG_SUSPENDED' },
  { value: 'ORG_DELETED', label: 'ORG_DELETED' },
  { value: 'ADMIN_CREATED', label: 'ADMIN_CREATED' },
  { value: 'ADMIN_UPDATED', label: 'ADMIN_UPDATED' },
  { value: 'IMPERSONATION_STARTED', label: 'IMPERSONATION_STARTED' },
  { value: 'IMPERSONATION_ENDED', label: 'IMPERSONATION_ENDED' },
  { value: 'ONBOARDING_APPROVED', label: 'ONBOARDING_APPROVED' },
  { value: 'ONBOARDING_REJECTED', label: 'ONBOARDING_REJECTED' },
];

// ── Page ───────────────────────────────────────────────────────────────
export default function PlatformAuditPage() {
  const { logs, meta, loading, error, filters, setFilters, refetch } = usePlatformAudit({
    page: 1,
    pageSize: 20,
  });

  // Local state for date inputs (kept in sync with filters via change handlers)
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? '');
  const [dateTo, setDateTo] = useState(filters.dateTo ?? '');

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    fontSize: 13,
    background: 'var(--bg-sunken)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    outline: 'none',
  };

  const columns = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (e: PlatformAuditEntry) => (
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {dateTime(e.createdAt)}
        </span>
      ),
    },
    {
      key: 'platformAdmin',
      header: 'Platform Admin',
      render: (e: PlatformAuditEntry) => (
        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
          {e.platformAdmin?.fullName ?? '—'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (e: PlatformAuditEntry) => (
        <span
          className="font-mono"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: actionColor(e.action),
            whiteSpace: 'nowrap',
          }}
        >
          {e.action}
        </span>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (e: PlatformAuditEntry) => {
        const id = e.targetId
          ? e.targetId.length > 16
            ? e.targetId.slice(0, 8) + '…' + e.targetId.slice(-4)
            : e.targetId
          : null;
        return (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>{e.targetType}</span>
            {id && (
              <>
                {' '}
                <span className="font-mono" style={{ fontSize: 11 }}>{id}</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      key: 'details',
      header: 'Details',
      render: (e: PlatformAuditEntry) => {
        const fullJson = JSON.stringify(e.payload);
        const truncated =
          fullJson.length > 60 ? fullJson.slice(0, 60) + '…' : fullJson;
        return (
          <TVTooltip content={fullJson} side="top">
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                cursor: 'default',
                maxWidth: 200,
                display: 'inline-block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {truncated}
            </span>
          </TVTooltip>
        );
      },
    },
    {
      key: 'ipAddress',
      header: 'IP',
      render: (e: PlatformAuditEntry) => (
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {e.ipAddress}
        </span>
      ),
    },
  ];

  return (
    <div className="god-mode" style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <PageHeader title="Platform Audit Log" />
      </div>

      {/* Filters row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Action filter */}
        <TVSelect
          value={filters.action ?? ''}
          onValueChange={(v: string) =>
            setFilters({ ...filters, action: v || undefined, page: 1 })
          }
          options={ACTION_OPTIONS}
          placeholder="All Actions"
        />

        {/* Target Type filter */}
        <TVSelect
          value={filters.targetType ?? ''}
          onValueChange={(v: string) =>
            setFilters({ ...filters, targetType: v || undefined, page: 1 })
          }
          options={TARGET_TYPE_OPTIONS}
          placeholder="All Types"
        />

        {/* Date From */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setFilters({ ...filters, dateFrom: e.target.value || undefined, page: 1 });
            }}
            style={inputStyle}
          />
        </div>

        {/* Date To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setFilters({ ...filters, dateTo: e.target.value || undefined, page: 1 });
            }}
            style={inputStyle}
          />
        </div>

        {/* Clear filters */}
        {(filters.action || filters.targetType || filters.dateFrom || filters.dateTo) && (
          <button
            className="btn-ghost"
            style={{ fontSize: 12, padding: '5px 12px' }}
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setFilters({ page: 1, pageSize: filters.pageSize });
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 14 }}>
          <ErrorBanner message={error} onRetry={refetch} />
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={10} cols={6} />
      ) : logs.length === 0 ? (
        <div className="tv-card-flat" style={{ padding: '0 0 8px' }}>
          <EmptyState
            title="No audit log entries"
            description="Audit events will appear here as platform admins perform actions."
          />
        </div>
      ) : (
        <DataTable columns={columns} data={logs} paginate={false} />
      )}

      {/* Pagination */}
      {!loading && meta.total > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          <span>
            <span className="font-mono">
              {(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.total)}
            </span>
            {' '}of{' '}
            <span className="font-mono">{meta.total}</span> entries
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TVSelect
              value={String(filters.pageSize ?? 20)}
              onValueChange={(v: string) =>
                setFilters({ ...filters, pageSize: Number(v), page: 1 })
              }
              options={[
                { value: '20', label: '20 / page' },
                { value: '50', label: '50 / page' },
                { value: '100', label: '100 / page' },
              ]}
              small
            />
            <button
              className="btn-ghost"
              style={{ padding: '4px 10px', fontSize: 12 }}
              disabled={meta.page <= 1}
              onClick={() => setFilters({ ...filters, page: meta.page - 1 })}
            >
              Prev
            </button>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {meta.page} / {meta.totalPages}
            </span>
            <button
              className="btn-ghost"
              style={{ padding: '4px 10px', fontSize: 12 }}
              disabled={meta.page >= meta.totalPages}
              onClick={() => setFilters({ ...filters, page: meta.page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
