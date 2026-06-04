// API CALLS: 1
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { useGodOrgsPage } from '../../hooks/pages/god/useGodOrgsPage';
import { useOrganisations } from '../../hooks/god/useOrganisations';
import { SkeletonTable, EmptyState, LoadingButton } from '../../components/states';
import { ErrorBanner } from '../../components/states';
import { PlanBadge } from '../../components/god/PlanBadge';
import { OrgStatusBadge } from '../../components/god/OrgStatusBadge';
import { useToast } from '../../context/ToastContext';
import { relTime, daysUntil } from '../../lib/utils.js';
import type { OrgWithStats } from '../../types/god.types';

// Cast ui.jsx exports — JS module, props typed loosely
import {
  PageHeader as _PageHeader,
  DataTable as _DataTable,
  Modal as _Modal,
  TVSelect as _TVSelect,
  Menu as _Menu,
  MenuItem as _MenuItem,
  MenuSeparator as _MenuSeparator,
} from '../../components/ui.jsx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PageHeader = _PageHeader as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataTable = _DataTable as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Modal = _Modal as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TVSelect = _TVSelect as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Menu = _Menu as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MenuItem = _MenuItem as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MenuSeparator = _MenuSeparator as React.FC<any>;

// ── Suspend Modal ──────────────────────────────────────────────────────
interface SuspendModalProps {
  org: OrgWithStats | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}
function SuspendModal({ org, open, onClose, onConfirm }: SuspendModalProps) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setReason(''); setErr(null); setBusy(false); }
  }, [open]);

  const submit = async () => {
    if (!reason.trim()) { setErr('Reason is required'); return; }
    setBusy(true);
    setErr(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch {
      setErr('Failed to suspend organisation');
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v: boolean) => !v && onClose()}
      title={`Suspend: ${org?.name ?? ''}`}
      width={480}
      footer={
        <>
          <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={onClose}>
            Cancel
          </button>
          <LoadingButton
            loading={busy}
            className="god-accent-btn"
            style={{ padding: '7px 16px', fontSize: 13 }}
            onClick={() => void submit()}
          >
            Suspend Organisation
          </LoadingButton>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
        Suspending this organisation will lock out all its users immediately. Provide a reason for the audit log.
      </p>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
        Reason <span style={{ color: 'var(--status-danger-text)' }}>*</span>
      </label>
      <textarea
        rows={3}
        placeholder="e.g. Payment overdue / Policy violation"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{
          width: '100%',
          resize: 'vertical',
          padding: '8px 10px',
          fontSize: 13,
          background: 'var(--bg-sunken)',
          border: '1px solid var(--border-strong)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          boxSizing: 'border-box',
        }}
      />
      {err && (
        <p style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 6 }}>{err}</p>
      )}
    </Modal>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────
interface DeleteModalProps {
  org: OrgWithStats | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}
function DeleteModal({ org, open, onClose, onConfirm }: DeleteModalProps) {
  const [typedSlug, setTypedSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setTypedSlug(''); setErr(null); setBusy(false); }
  }, [open]);

  const submit = async () => {
    if (typedSlug !== org?.slug) { setErr(`Type the slug "${org?.slug}" to confirm`); return; }
    setBusy(true);
    setErr(null);
    try {
      await onConfirm();
      onClose();
    } catch {
      setErr('Failed to delete organisation');
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v: boolean) => !v && onClose()}
      title="Delete Organisation"
      width={480}
      footer={
        <>
          <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={onClose}>
            Cancel
          </button>
          <LoadingButton
            loading={busy}
            disabled={typedSlug !== org?.slug}
            style={{
              padding: '7px 16px',
              fontSize: 13,
              background: 'var(--status-danger-bg)',
              color: 'var(--status-danger-text)',
              border: '1px solid var(--status-danger-border)',
              borderRadius: 8,
              fontWeight: 500,
              cursor: typedSlug !== org?.slug ? 'not-allowed' : 'pointer',
            }}
            onClick={() => void submit()}
          >
            Permanently Delete
          </LoadingButton>
        </>
      }
    >
      <div
        style={{
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13,
          color: '#f87171',
          marginBottom: 16,
        }}
      >
        This action is <strong>irreversible</strong>. All data for{' '}
        <strong>{org?.name}</strong> will be permanently deleted.
      </div>
      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
        Type <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{org?.slug}</span> to confirm
      </label>
      <input
        type="text"
        value={typedSlug}
        onChange={(e) => setTypedSlug(e.target.value)}
        placeholder={org?.slug ?? ''}
        style={{
          width: '100%',
          padding: '8px 10px',
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          background: 'var(--bg-sunken)',
          border: '1px solid var(--border-strong)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          boxSizing: 'border-box',
        }}
      />
      {err && (
        <p style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 6 }}>{err}</p>
      )}
    </Modal>
  );
}

// ── Trial display helper ───────────────────────────────────────────────
function trialDisplay(org: OrgWithStats): string {
  if (!org.billing?.trialEndsAt) return '—';
  const d = daysUntil(org.billing.trialEndsAt);
  if (d > 0) return `${d}d left`;
  return 'Expired';
}

// ── Page ───────────────────────────────────────────────────────────────
export default function OrgsListPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Single-call page hook for list data
  const { organisations, meta, loading, error, filters, setFilters, refetch } =
    useGodOrgsPage({ page: 1, pageSize: 20 });

  // Mutations only — no list fetch
  const { suspendOrg, reactivateOrg, deleteOrg } = useOrganisations({ page: 1, pageSize: 1 });

  // Search debounce
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilters({ search: value || undefined, page: 1 });
      }, 300);
    },
    [setFilters],
  );
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Modals
  const [suspendTarget, setSuspendTarget] = useState<OrgWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgWithStats | null>(null);

  const handleSuspend = async (reason: string) => {
    if (!suspendTarget) return;
    await suspendOrg(suspendTarget.id, reason);
    toast.success(`${suspendTarget.name} suspended`);
    refetch();
  };

  const handleReactivate = async (org: OrgWithStats) => {
    try {
      await reactivateOrg(org.id);
      toast.success(`${org.name} reactivated`);
      refetch();
    } catch {
      toast.error('Failed to reactivate organisation');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteOrg(deleteTarget.id, deleteTarget.slug);
    toast.success(`${deleteTarget.name} deleted`);
    refetch();
  };

  // DataTable columns
  const columns = [
    {
      key: 'name',
      header: 'Organisation',
      render: (o: OrgWithStats) => (
        <div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{o.name}</div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
            {o.slug}
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (o: OrgWithStats) => <PlanBadge plan={o.plan} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o: OrgWithStats) => <OrgStatusBadge org={o} />,
    },
    {
      key: 'users',
      header: 'Users',
      align: 'right' as const,
      render: (o: OrgWithStats) => (
        <span className="font-mono" style={{ fontSize: 13 }}>{o._count?.users ?? 0}</span>
      ),
    },
    {
      key: 'vehicles',
      header: 'Vehicles',
      align: 'right' as const,
      render: (o: OrgWithStats) => (
        <span className="font-mono" style={{ fontSize: 13 }}>{o._count?.vehicles ?? 0}</span>
      ),
    },
    {
      key: 'trips',
      header: 'Trips MTD',
      align: 'right' as const,
      render: (o: OrgWithStats) => (
        <span className="font-mono" style={{ fontSize: 13 }}>{o._count?.trips ?? 0}</span>
      ),
    },
    {
      key: 'lastActivityAt',
      header: 'Last Activity',
      render: (o: OrgWithStats) => (
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {o.lastActivityAt ? relTime(o.lastActivityAt) : '—'}
        </span>
      ),
    },
    {
      key: 'trial',
      header: 'Trial',
      render: (o: OrgWithStats) => {
        const t = trialDisplay(o);
        const isExpired = t === 'Expired';
        const isActive = !isExpired && t !== '—';
        return (
          <span
            style={{
              fontSize: 12,
              color: isExpired ? 'var(--status-danger-text)' : isActive ? '#4ade80' : 'var(--text-muted)',
            }}
          >
            {t}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: 44,
      render: (o: OrgWithStats) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Menu
            trigger={
              <button
                className="btn-ghost"
                style={{ padding: '4px 6px', display: 'flex', alignItems: 'center' }}
                aria-label="Row actions"
              >
                <MoreHorizontal size={15} style={{ color: 'var(--text-muted)' }} />
              </button>
            }
            align="end"
          >
            <MenuItem onSelect={() => navigate(`/god/organisations/${o.id}`)}>View Details</MenuItem>
            <MenuItem onSelect={() => navigate(`/god/organisations/${o.id}`)}>Edit</MenuItem>
            <MenuSeparator />
            {o.isActive && (
              <MenuItem
                danger
                onSelect={() => setSuspendTarget(o)}
              >
                Suspend
              </MenuItem>
            )}
            {!o.isActive && o.suspendedReason !== 'DELETED' && (
              <MenuItem onSelect={() => void handleReactivate(o)}>Reactivate</MenuItem>
            )}
            <MenuSeparator />
            <MenuItem danger onSelect={() => setDeleteTarget(o)}>
              Delete
            </MenuItem>
          </Menu>
        </div>
      ),
    },
  ];

  const planOptions = [
    { value: 'all', label: 'All Plans' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Suspended' },
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Newest first' },
    { value: 'name', label: 'Name A–Z' },
    { value: 'plan', label: 'Plan' },
  ];

  const currentStatus = filters.isActive === true ? 'true' : filters.isActive === false ? 'false' : 'all';
  const currentPlan = (filters.plan as string | undefined) ?? 'all';
  const currentSort = (filters.sortBy as string | undefined) ?? 'createdAt';

  return (
    <div className="god-mode" style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <PageHeader
          title="Organisations"
          actions={
            <button
              className="god-accent-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}
              onClick={() => navigate('/god/organisations/new')}
            >
              <Plus size={15} />
              Create Organisation
            </button>
          }
        />
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
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search by name or slug…"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 32,
              paddingRight: 10,
              paddingTop: 7,
              paddingBottom: 7,
              fontSize: 13,
              background: 'var(--bg-sunken)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Plan filter */}
        <TVSelect
          value={currentPlan}
          onValueChange={(v: string) =>
            setFilters({ plan: v === 'all' ? undefined : v, page: 1 })
          }
          options={planOptions}
          placeholder="All Plans"
        />

        {/* Status filter */}
        <TVSelect
          value={currentStatus}
          onValueChange={(v: string) => {
            const isActive = v === 'true' ? true : v === 'false' ? false : undefined;
            setFilters({ isActive, page: 1 });
          }}
          options={statusOptions}
          placeholder="All Statuses"
        />

        {/* Sort */}
        <TVSelect
          value={currentSort}
          onValueChange={(v: string) => setFilters({ sortBy: v, page: 1 })}
          options={sortOptions}
          placeholder="Sort by…"
        />
      </div>

      {/* Error */}
      {error && <div style={{ marginBottom: 14 }}><ErrorBanner message={error} onRetry={refetch} /></div>}

      {/* Table / Skeleton / Empty */}
      {loading ? (
        <SkeletonTable rows={8} cols={9} />
      ) : organisations.length === 0 ? (
        <div className="tv-card-flat" style={{ padding: '0 0 8px' }}>
          <EmptyState
            title="No organisations found"
            description="Try adjusting your filters or create a new organisation."
            action={
              <button
                className="god-accent-btn"
                style={{ padding: '8px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => navigate('/god/organisations/new')}
              >
                <Plus size={14} /> Create Organisation
              </button>
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={organisations}
          paginate={false}
          onRowClick={(o: OrgWithStats) => navigate(`/god/organisations/${o.id}`)}
        />
      )}

      {/* Pagination */}
      {!loading && meta && meta.total > 0 && (
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
            <span className="font-mono">{(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.total)}</span>
            {' '}of{' '}
            <span className="font-mono">{meta.total}</span> organisations
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TVSelect
              value={String((filters.pageSize as number | undefined) ?? 20)}
              onValueChange={(v: string) => setFilters({ pageSize: Number(v), page: 1 })}
              options={[
                { value: '10', label: '10 / page' },
                { value: '20', label: '20 / page' },
                { value: '50', label: '50 / page' },
              ]}
              small
            />
            <button
              className="btn-ghost"
              style={{ padding: '4px 10px', fontSize: 12 }}
              disabled={meta.page <= 1}
              onClick={() => setFilters({ page: meta.page - 1 })}
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
              onClick={() => setFilters({ page: meta.page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      <SuspendModal
        org={suspendTarget}
        open={suspendTarget !== null}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleSuspend}
      />

      {/* Delete Modal */}
      <DeleteModal
        org={deleteTarget}
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
