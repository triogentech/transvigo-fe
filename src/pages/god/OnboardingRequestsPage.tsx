import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useOnboardingRequests } from '../../hooks/god/useOnboardingRequests';
import { SkeletonTable, EmptyState, ErrorBanner, LoadingButton } from '../../components/states';
import { useToast } from '../../context/ToastContext';
import { relTime } from '../../lib/utils.js';
import type { OnboardingRequest, OnboardingStatus, CreateOrgBody, PlanName } from '../../types/god.types';

import {
  PageHeader as _PageHeader,
  DataTable as _DataTable,
  Modal as _Modal,
  TVSelect as _TVSelect,
  TVTooltip as _TVTooltip,
  SegmentTabs as _SegmentTabs,
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
const TVTooltip = _TVTooltip as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SegmentTabs = _SegmentTabs as React.FC<any>;

// ── Status pill ────────────────────────────────────────────────────────
const STATUS_META: Record<OnboardingStatus, { label: string; bg: string; color: string; border: string }> = {
  PENDING: {
    label: 'Pending',
    bg: 'rgba(251,191,36,0.12)',
    color: '#f59e0b',
    border: 'rgba(251,191,36,0.3)',
  },
  APPROVED: {
    label: 'Approved',
    bg: 'rgba(74,222,128,0.12)',
    color: '#4ade80',
    border: 'rgba(74,222,128,0.3)',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'rgba(248,113,113,0.12)',
    color: '#f87171',
    border: 'rgba(248,113,113,0.3)',
  },
  SUSPENDED: {
    label: 'Suspended',
    bg: 'rgba(100,116,139,0.12)',
    color: '#94a3b8',
    border: 'rgba(100,116,139,0.3)',
  },
};

function StatusPill({ status }: { status: OnboardingStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.PENDING;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.border}`,
        borderRadius: 20,
      }}
    >
      {m.label}
    </span>
  );
}

// ── Slugify helper ──────────────────────────────────────────────────────
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-');
}

// ── Review Modal ────────────────────────────────────────────────────────
interface ReviewModalProps {
  request: OnboardingRequest | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string, body: CreateOrgBody) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

function ReviewModal({ request, open, onClose, onApprove, onReject }: ReviewModalProps) {
  const [orgForm, setOrgForm] = useState<CreateOrgBody>({
    name: '',
    slug: '',
    plan: 'starter',
    adminEmail: '',
    adminUsername: '',
    adminFullName: '',
    contactPhone: '',
    billingEmail: '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [mode, setMode] = useState<'review' | 'reject'>('review');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open && request) {
      const emailPrefix = request.companyEmail.split('@')[0] ?? request.companyEmail;
      setOrgForm({
        name: request.companyName,
        slug: slugify(request.companyName),
        plan: (request.plan as PlanName) || 'starter',
        adminEmail: request.companyEmail,
        adminUsername: emailPrefix,
        adminFullName: request.contactName,
        contactPhone: request.contactPhone,
        billingEmail: request.companyEmail,
      });
      setRejectReason('');
      setMode('review');
      setErr(null);
      setBusy(false);
    }
    if (!open) {
      setErr(null);
      setBusy(false);
    }
  }, [open, request]);

  const setField = (key: keyof CreateOrgBody, value: string) =>
    setOrgForm((f) => ({ ...f, [key]: value }));

  const handleApprove = async () => {
    if (!request) return;
    if (!orgForm.name.trim()) { setErr('Organisation name is required'); return; }
    if (!orgForm.slug.trim()) { setErr('Slug is required'); return; }
    setBusy(true);
    setErr(null);
    try {
      await onApprove(request.id, orgForm);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to approve request';
      setErr(msg);
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    if (!rejectReason.trim()) { setErr('Rejection reason is required'); return; }
    setBusy(true);
    setErr(null);
    try {
      await onReject(request.id, rejectReason.trim());
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to reject request';
      setErr(msg);
      setBusy(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    fontSize: 13,
    background: 'var(--bg-sunken)',
    border: '1px solid var(--border-strong)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginBottom: 4,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };

  const readValStyle: React.CSSProperties = {
    fontSize: 13,
    color: 'var(--text-primary)',
    padding: '6px 10px',
    background: 'var(--bg-sunken)',
    border: '1px solid var(--border)',
    borderRadius: 6,
  };

  if (!request) return null;

  return (
    <Modal
      open={open}
      onOpenChange={(v: boolean) => !v && onClose()}
      title={`Review: ${request.companyName}`}
      width={640}
      footer={
        mode === 'review' ? (
          <>
            <button
              className="btn-ghost"
              style={{ padding: '7px 16px', fontSize: 13 }}
              onClick={onClose}
            >
              Close
            </button>
            <button
              style={{
                padding: '7px 16px',
                fontSize: 13,
                background: 'rgba(248,113,113,0.12)',
                color: '#f87171',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 8,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onClick={() => { setMode('reject'); setErr(null); }}
            >
              Reject
            </button>
            <LoadingButton
              loading={busy}
              className="god-accent-btn"
              style={{ padding: '7px 16px', fontSize: 13 }}
              onClick={() => void handleApprove()}
            >
              Approve & Create Org
            </LoadingButton>
          </>
        ) : (
          <>
            <button
              className="btn-ghost"
              style={{ padding: '7px 16px', fontSize: 13 }}
              onClick={() => { setMode('review'); setErr(null); }}
            >
              Back
            </button>
            <LoadingButton
              loading={busy}
              style={{
                padding: '7px 16px',
                fontSize: 13,
                background: 'rgba(248,113,113,0.12)',
                color: '#f87171',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 8,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onClick={() => void handleReject()}
            >
              Confirm Rejection
            </LoadingButton>
          </>
        )
      }
    >
      {mode === 'review' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Request details */}
          <div
            style={{
              background: 'var(--bg-sunken)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 16px',
            }}
          >
            <div>
              <div style={labelStyle}>Company</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                {request.companyName}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Plan</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{request.plan}</div>
            </div>
            <div>
              <div style={labelStyle}>Contact</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{request.contactName}</div>
            </div>
            <div>
              <div style={labelStyle}>Phone</div>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {request.contactPhone}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Email</div>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {request.companyEmail}
              </div>
            </div>
            {request.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={labelStyle}>Notes</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{request.notes}</div>
              </div>
            )}
          </div>

          {/* Org creation form */}
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginBottom: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Organisation to Create
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
              <div>
                <label style={labelStyle}>
                  Name <span style={{ color: 'var(--status-danger-text)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={orgForm.name}
                  onChange={(e) => setField('name', e.target.value)}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Slug <span style={{ color: 'var(--status-danger-text)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={orgForm.slug}
                  onChange={(e) => setField('slug', e.target.value)}
                  style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Plan</label>
                <TVSelect
                  value={orgForm.plan}
                  onValueChange={(v: string) => setField('plan', v)}
                  options={PLAN_OPTIONS}
                />
              </div>
              <div>
                <label style={labelStyle}>Admin Email</label>
                <div style={{ ...readValStyle, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {orgForm.adminEmail}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Admin Username</label>
                <input
                  type="text"
                  value={orgForm.adminUsername}
                  onChange={(e) => setField('adminUsername', e.target.value)}
                  style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Admin Full Name</label>
                <input
                  type="text"
                  value={orgForm.adminFullName}
                  onChange={(e) => setField('adminFullName', e.target.value)}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Billing Email</label>
                <input
                  type="email"
                  value={orgForm.billingEmail ?? ''}
                  onChange={(e) => setField('billingEmail', e.target.value)}
                  style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Contact Phone</label>
                <input
                  type="text"
                  value={orgForm.contactPhone ?? ''}
                  onChange={(e) => setField('contactPhone', e.target.value)}
                  style={fieldStyle}
                />
              </div>
            </div>
          </div>

          {err && (
            <p style={{ fontSize: 12, color: 'var(--status-danger-text)', margin: 0 }}>{err}</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Provide a reason for rejecting the onboarding request from{' '}
            <strong>{request.companyName}</strong>.
          </p>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Rejection Reason <span style={{ color: 'var(--status-danger-text)' }}>*</span>
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Duplicate request / Incomplete information / Outside service area"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
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
          </div>
          {err && (
            <p style={{ fontSize: 12, color: 'var(--status-danger-text)', margin: 0 }}>{err}</p>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Page ───────────────────────────────────────────────────────────────
const TAB_OPTIONS = ['All', 'PENDING', 'APPROVED', 'REJECTED'] as const;
type TabValue = (typeof TAB_OPTIONS)[number];

export default function OnboardingRequestsPage() {
  const toast = useToast();
  const { requests, meta, loading, error, filters, setFilters, refetch, approve, reject } =
    useOnboardingRequests({ page: 1, pageSize: 20 });

  const [reviewTarget, setReviewTarget] = useState<OnboardingRequest | null>(null);

  const activeTab: TabValue = (filters.status as TabValue) ?? 'All';

  const handleTabChange = (tab: string) => {
    setFilters({
      ...filters,
      status: tab === 'All' ? undefined : (tab as OnboardingStatus),
      page: 1,
    });
  };

  const handleApprove = async (id: string, body: CreateOrgBody) => {
    await approve(id, body);
    toast.success('Organisation created and request approved');
  };

  const handleReject = async (id: string, reason: string) => {
    await reject(id, reason);
    toast.success('Request rejected');
  };

  const columns = [
    {
      key: 'companyName',
      header: 'Company',
      render: (r: OnboardingRequest) => (
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.companyName}</span>
      ),
    },
    {
      key: 'contactName',
      header: 'Contact',
      render: (r: OnboardingRequest) => (
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.contactName}</span>
      ),
    },
    {
      key: 'companyEmail',
      header: 'Email',
      render: (r: OnboardingRequest) => (
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {r.companyEmail}
        </span>
      ),
    },
    {
      key: 'contactPhone',
      header: 'Phone',
      render: (r: OnboardingRequest) => (
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.contactPhone}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (r: OnboardingRequest) => (
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {r.plan}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Received',
      render: (r: OnboardingRequest) => (
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {relTime(r.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: OnboardingRequest) => <StatusPill status={r.status} />,
    },
    {
      key: 'actions',
      header: '',
      width: 120,
      render: (r: OnboardingRequest) => (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {r.status === 'PENDING' && (
            <button
              className="god-accent-btn"
              style={{ padding: '5px 12px', fontSize: 12 }}
              onClick={() => setReviewTarget(r)}
            >
              Review
            </button>
          )}
          {r.status === 'APPROVED' && r.orgId && (
            <Link
              to={`/god/organisations/${r.orgId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                color: '#60a5fa',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              View Org <ArrowRight size={12} />
            </Link>
          )}
          {r.status === 'REJECTED' && r.rejectionReason && (
            <TVTooltip content={r.rejectionReason} side="top">
              <span
                style={{
                  fontSize: 11,
                  color: '#f87171',
                  cursor: 'default',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
              >
                {r.rejectionReason}
              </span>
            </TVTooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="god-mode" style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <PageHeader title="Onboarding Requests" />
      </div>

      {/* Tab filters */}
      <div style={{ marginBottom: 16 }}>
        <SegmentTabs
          tabs={TAB_OPTIONS.map((t) => ({ value: t, label: t === 'All' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase() }))}
          value={activeTab}
          onValueChange={handleTabChange}
        />
      </div>

      {error && (
        <div style={{ marginBottom: 14 }}>
          <ErrorBanner message={error} onRetry={refetch} />
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={8} cols={8} />
      ) : requests.length === 0 ? (
        <div className="tv-card-flat" style={{ padding: '0 0 8px' }}>
          <EmptyState
            title="No onboarding requests"
            description={
              activeTab === 'All'
                ? 'No onboarding requests have been submitted yet.'
                : `No ${activeTab.toLowerCase()} requests found.`
            }
          />
        </div>
      ) : (
        <DataTable columns={columns} data={requests} paginate={false} />
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
            <span className="font-mono">{meta.total}</span> requests
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

      <ReviewModal
        request={reviewTarget}
        open={reviewTarget !== null}
        onClose={() => setReviewTarget(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
