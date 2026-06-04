import React, { useEffect, useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { usePlatformAdmins } from '../../hooks/god/usePlatformAdmins';
import { usePlatformAuth } from '../../hooks/god/usePlatformAuth';
import { SkeletonTable, EmptyState, ErrorBanner, LoadingButton } from '../../components/states';
import { useToast } from '../../context/ToastContext';
import { shortDate } from '../../lib/utils.js';
import type { PlatformAdminPublic, PlatformRole } from '../../types/god.types';
import type { CreateAdminBody, UpdateAdminBody } from '../../api/god/admins.api';

import {
  PageHeader as _PageHeader,
  DataTable as _DataTable,
  Modal as _Modal,
  TVSelect as _TVSelect,
  Menu as _Menu,
  MenuItem as _MenuItem,
  MenuSeparator as _MenuSeparator,
  ConfirmDialog as _ConfirmDialog,
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ConfirmDialog = _ConfirmDialog as React.FC<any>;

// ── Role badge ─────────────────────────────────────────────────────────
const ROLE_META: Record<PlatformRole, { label: string; bg: string; color: string; border: string; icon?: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    bg: 'rgba(251,191,36,0.12)',
    color: '#f59e0b',
    border: 'rgba(251,191,36,0.3)',
    icon: '⚡',
  },
  SUPPORT_ADMIN: {
    label: 'Support Admin',
    bg: 'rgba(59,130,246,0.12)',
    color: '#60a5fa',
    border: 'rgba(59,130,246,0.3)',
  },
  BILLING_ADMIN: {
    label: 'Billing Admin',
    bg: 'rgba(34,197,94,0.12)',
    color: '#4ade80',
    border: 'rgba(34,197,94,0.3)',
  },
};

function RoleBadge({ role }: { role: PlatformRole }) {
  const m = ROLE_META[role] ?? ROLE_META.SUPPORT_ADMIN;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.border}`,
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      {m.icon && <span style={{ fontSize: 10 }}>{m.icon}</span>}
      {m.label}
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        background: active ? 'rgba(74,222,128,0.12)' : 'rgba(100,116,139,0.12)',
        color: active ? '#4ade80' : '#94a3b8',
        border: `1px solid ${active ? 'rgba(74,222,128,0.3)' : 'rgba(100,116,139,0.3)'}`,
        borderRadius: 20,
      }}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ── Add Admin Modal ─────────────────────────────────────────────────────
interface AddAdminModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: CreateAdminBody) => Promise<void>;
}

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: '⚡ Super Admin' },
  { value: 'SUPPORT_ADMIN', label: 'Support Admin' },
  { value: 'BILLING_ADMIN', label: 'Billing Admin' },
];

function AddAdminModal({ open, onClose, onSubmit }: AddAdminModalProps) {
  const [form, setForm] = useState<CreateAdminBody>({
    fullName: '',
    email: '',
    username: '',
    password: '',
    role: 'SUPPORT_ADMIN',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm({ fullName: '', email: '', username: '', password: '', role: 'SUPPORT_ADMIN' });
      setErr(null);
      setBusy(false);
    }
  }, [open]);

  const set = (key: keyof CreateAdminBody, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.fullName.trim()) { setErr('Full name is required'); return; }
    if (!form.email.trim()) { setErr('Email is required'); return; }
    if (!form.username.trim()) { setErr('Username is required'); return; }
    if (!form.password.trim()) { setErr('Password is required'); return; }
    setBusy(true);
    setErr(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create admin';
      setErr(msg);
      setBusy(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
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
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 5,
    fontWeight: 500,
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v: boolean) => !v && onClose()}
      title="Add Platform Admin"
      width={520}
      footer={
        <>
          <button
            className="btn-ghost"
            style={{ padding: '7px 16px', fontSize: 13 }}
            onClick={onClose}
          >
            Cancel
          </button>
          <LoadingButton
            loading={busy}
            className="god-accent-btn"
            style={{ padding: '7px 16px', fontSize: 13 }}
            onClick={() => void submit()}
          >
            Create Admin
          </LoadingButton>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>
            Full Name <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="Jane Smith"
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>
            Email <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="jane@example.com"
            style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <div>
          <label style={labelStyle}>
            Username <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
            placeholder="jane_smith"
            style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <div>
          <label style={labelStyle}>
            Password <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="••••••••"
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>
            Role <span style={{ color: 'var(--status-danger-text)' }}>*</span>
          </label>
          <TVSelect
            value={form.role}
            onValueChange={(v: string) => set('role', v)}
            options={ROLE_OPTIONS}
            placeholder="Select role…"
          />
        </div>
        {err && (
          <p style={{ fontSize: 12, color: 'var(--status-danger-text)', margin: 0 }}>{err}</p>
        )}
      </div>
    </Modal>
  );
}

// ── Edit Role Modal ─────────────────────────────────────────────────────
interface EditRoleModalProps {
  admin: PlatformAdminPublic | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (role: PlatformRole) => Promise<void>;
}

function EditRoleModal({ admin, open, onClose, onSubmit }: EditRoleModalProps) {
  const [role, setRole] = useState<PlatformRole>('SUPPORT_ADMIN');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open && admin) setRole(admin.role);
    if (!open) { setErr(null); setBusy(false); }
  }, [open, admin]);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onSubmit(role);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update role';
      setErr(msg);
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v: boolean) => !v && onClose()}
      title={`Edit Role: ${admin?.fullName ?? ''}`}
      width={400}
      footer={
        <>
          <button
            className="btn-ghost"
            style={{ padding: '7px 16px', fontSize: 13 }}
            onClick={onClose}
          >
            Cancel
          </button>
          <LoadingButton
            loading={busy}
            className="god-accent-btn"
            style={{ padding: '7px 16px', fontSize: 13 }}
            onClick={() => void submit()}
          >
            Save Role
          </LoadingButton>
        </>
      }
    >
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          New Role
        </label>
        <TVSelect
          value={role}
          onValueChange={(v: string) => setRole(v as PlatformRole)}
          options={ROLE_OPTIONS}
          placeholder="Select role…"
        />
        {err && (
          <p style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 8 }}>{err}</p>
        )}
      </div>
    </Modal>
  );
}

// ── Page ───────────────────────────────────────────────────────────────
export default function PlatformAdminsPage() {
  const toast = useToast();
  const { admins, loading, error, refetch, createAdmin, updateAdmin } = usePlatformAdmins();
  const { admin: currentAdmin } = usePlatformAuth();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlatformAdminPublic | null>(null);

  const handleCreate = async (body: CreateAdminBody) => {
    await createAdmin(body);
    toast.success(`Admin "${body.fullName}" created`);
  };

  const handleEditRole = async (role: PlatformRole) => {
    if (!editTarget) return;
    await updateAdmin(editTarget.id, { role } as UpdateAdminBody);
    toast.success(`Role updated to ${role}`);
    setEditTarget(null);
  };

  const handleDeactivate = async (admin: PlatformAdminPublic) => {
    try {
      await updateAdmin(admin.id, { isActive: false } as UpdateAdminBody);
      toast.success(`${admin.fullName} deactivated`);
    } catch {
      toast.error('Failed to deactivate admin');
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Name',
      render: (a: PlatformAdminPublic) => (
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.fullName}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (a: PlatformAdminPublic) => (
        <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {a.email}
        </span>
      ),
    },
    {
      key: 'username',
      header: 'Username',
      render: (a: PlatformAdminPublic) => (
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.username}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (a: PlatformAdminPublic) => <RoleBadge role={a.role} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (a: PlatformAdminPublic) => <StatusPill active={a.isActive ?? true} />,
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (a: PlatformAdminPublic) => (
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {a.lastLoginAt ? shortDate(a.lastLoginAt) : '—'}
        </span>
      ),
    },
    {
      key: 'mfa',
      header: '2FA',
      render: (a: PlatformAdminPublic) => (
        <span
          style={{
            fontSize: 12,
            color: a.mfaEnabled ? '#4ade80' : 'var(--text-muted)',
          }}
        >
          {a.mfaEnabled ? 'On' : 'Off'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 44,
      render: (a: PlatformAdminPublic) => {
        const isSelf = a.id === currentAdmin?.id;
        return (
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
              <MenuItem onSelect={() => setEditTarget(a)}>Edit Role</MenuItem>
              <MenuSeparator />
              <ConfirmDialog
                trigger={
                  <MenuItem danger disabled={isSelf}>
                    {isSelf ? 'Deactivate (own account)' : 'Deactivate'}
                  </MenuItem>
                }
                title={`Deactivate ${a.fullName}?`}
                description="This admin will no longer be able to log in to the platform."
                confirmLabel="Deactivate"
                variant="danger"
                onConfirm={() => void handleDeactivate(a)}
              />
            </Menu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="god-mode" style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <PageHeader
          title="Platform Admins"
          actions={
            <button
              className="god-accent-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}
              onClick={() => setAddOpen(true)}
            >
              <Plus size={15} />
              Add Platform Admin
            </button>
          }
        />
      </div>

      {error && (
        <div style={{ marginBottom: 14 }}>
          <ErrorBanner message={error} onRetry={refetch} />
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={6} cols={8} />
      ) : admins.length === 0 ? (
        <div className="tv-card-flat" style={{ padding: '0 0 8px' }}>
          <EmptyState
            title="No platform admins"
            description="Add your first platform admin to get started."
            action={
              <button
                className="god-accent-btn"
                style={{ padding: '8px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => setAddOpen(true)}
              >
                <Plus size={14} /> Add Platform Admin
              </button>
            }
          />
        </div>
      ) : (
        <DataTable columns={columns} data={admins} paginate={false} />
      )}

      <AddAdminModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreate}
      />

      <EditRoleModal
        admin={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditRole}
      />
    </div>
  );
}
