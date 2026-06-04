import React, { useState } from 'react';
import { useImpersonation } from '../../hooks/god/useImpersonation';
import { SkeletonTable, EmptyState, ErrorBanner, LoadingButton } from '../../components/states';
import { useToast } from '../../context/ToastContext';
import { relTime } from '../../lib/utils.js';
import type { ImpersonationSessionRow } from '../../types/god.types';

import {
  PageHeader as _PageHeader,
  DataTable as _DataTable,
} from '../../components/ui.jsx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PageHeader = _PageHeader as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataTable = _DataTable as React.FC<any>;

export default function ActiveImpersonationsPage() {
  const toast = useToast();
  const { active, loading, error, refetch, end } = useImpersonation();
  const [endingId, setEndingId] = useState<string | null>(null);

  const handleEnd = async (sessionId: string) => {
    setEndingId(sessionId);
    try {
      await end(sessionId);
      toast.success('Impersonation session ended');
    } catch {
      toast.error('Failed to end impersonation session');
    } finally {
      setEndingId(null);
    }
  };

  const columns = [
    {
      key: 'platformAdmin',
      header: 'Platform Admin',
      render: (row: ImpersonationSessionRow) => (
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
          {row.platformAdmin?.fullName ?? '—'}
        </span>
      ),
    },
    {
      key: 'targetOrg',
      header: 'Target Org',
      render: (row: ImpersonationSessionRow) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
            {row.targetOrg?.name ?? '—'}
          </div>
          {row.targetOrg?.slug && (
            <div
              className="font-mono"
              style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}
            >
              {row.targetOrg.slug}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'targetUser',
      header: 'Target User',
      render: (row: ImpersonationSessionRow) => (
        <span
          className="font-mono"
          style={{ fontSize: 13, color: row.targetUser ? 'var(--text-primary)' : 'var(--text-muted)' }}
        >
          {row.targetUser?.username ?? '—'}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row: ImpersonationSessionRow) => (
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            maxWidth: 260,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={row.reason}
        >
          {row.reason}
        </span>
      ),
    },
    {
      key: 'startedAt',
      header: 'Started',
      render: (row: ImpersonationSessionRow) => (
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {relTime(row.startedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 120,
      render: (row: ImpersonationSessionRow) => (
        <div onClick={(e) => e.stopPropagation()}>
          <LoadingButton
            loading={endingId === row.id}
            className="god-accent-btn"
            style={{ padding: '5px 12px', fontSize: 12 }}
            onClick={() => void handleEnd(row.id)}
          >
            End Session
          </LoadingButton>
        </div>
      ),
    },
  ];

  return (
    <div className="god-mode" style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <PageHeader title="Active Impersonations" />
      </div>

      {error && (
        <div style={{ marginBottom: 14 }}>
          <ErrorBanner message={error} onRetry={refetch} />
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : active.length === 0 ? (
        <div className="tv-card-flat" style={{ padding: '0 0 8px' }}>
          <EmptyState
            title="No active impersonation sessions"
            description="All platform admin impersonation sessions will appear here."
          />
        </div>
      ) : (
        <DataTable columns={columns} data={active} paginate={false} />
      )}
    </div>
  );
}
