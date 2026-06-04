import React, { useState } from 'react';
import { useOrgUsers, useRoles } from '../hooks/useAdmin';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { shortDate } from '../lib/utils.js';
import { matchesSearch } from '../lib/clientList';
import type { OrgUser, Role } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';
import { SearchInput } from '../components/SearchInput';
import { MoreHorizontal } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const Pill: React.FC<any> = UI.Pill;
const TVSelect: React.FC<any> = UI.TVSelect;
const TVSwitch: React.FC<any> = UI.TVSwitch;
const ConfirmDialog: React.FC<any> = UI.ConfirmDialog;
const Menu: React.FC<any> = UI.Menu;
const MenuItem: React.FC<any> = UI.MenuItem;
const MenuLabel: React.FC<any> = UI.MenuLabel;
const MenuSeparator: React.FC<any> = UI.MenuSeparator;

// ── Invite form ──────────────────────────────────────────────────────────────

interface InviteForm {
  email: string;
  username: string;
  roleId: string;
  password: string;
}

const EMPTY_INVITE: InviteForm = { email: '', username: '', roleId: '', password: '' };

// ── Credential panel: shows a generated temp password for the admin to share ──
function CredentialPanel({ password }: { password: string }) {
  const toast = useToast();
  return (
    <div className="flex flex-col gap-2">
      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
        Share this temporary password securely. The user must change it at first login.
      </div>
      <div
        className="flex items-center justify-between gap-3"
        style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '10px 12px' }}
      >
        <span className="font-mono" style={{ fontSize: 15, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>{password}</span>
        <button
          className="btn-ghost px-2 py-1"
          style={{ fontSize: 12 }}
          onClick={() => {
            void navigator.clipboard?.writeText(password).then(
              () => toast.success('Copied'),
              () => toast.error('Copy failed'),
            );
          }}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

// ── Reset Password modal ──
interface ResetPasswordModalProps {
  user: OrgUser;
  onClose: () => void;
  onReset: (userId: string, newPassword?: string) => Promise<{ tempPassword: string | null }>;
}

function ResetPasswordModal({ user, onClose, onReset }: ResetPasswordModalProps) {
  const [generate, setGenerate] = useState(true);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const toast = useToast();

  const save = async () => {
    if (!generate && password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await onReset(user.id, generate ? undefined : password);
      if (res.tempPassword) {
        setGenerated(res.tempPassword);
      } else {
        toast.success('Password updated');
        onClose();
      }
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onOpenChange={(v: boolean) => { if (!v) onClose(); }}
      title="Reset Password"
      footer={
        generated ? (
          <button className="btn-brand" onClick={onClose}>Done</button>
        ) : (
          <LoadingButton className="btn-brand" loading={saving} onClick={save}>
            Reset Password
          </LoadingButton>
        )
      }
    >
      {generated ? (
        <CredentialPanel password={generated} />
      ) : (
        <div className="flex flex-col gap-3">
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Resetting password for{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{user.username}</strong>. This signs them out of all sessions.
          </div>
          <label className="flex items-center justify-between py-1" style={{ fontSize: 13, color: 'var(--text-primary)' }}>
            Auto-generate a temporary password
            <TVSwitch checked={generate} onCheckedChange={(v: boolean) => setGenerate(v)} />
          </label>
          {!generate && (
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>New password</label>
              <input
                type="text"
                className="tv-input w-full font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                The user can sign in with this immediately (no forced change).
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Change Role modal ────────────────────────────────────────────────────────

interface ChangeRoleModalProps {
  user: OrgUser;
  roles: Role[];
  onClose: () => void;
  onSave: (userId: string, roleId: string) => Promise<unknown>;
}

function ChangeRoleModal({ user, roles, onClose, onSave }: ChangeRoleModalProps) {
  const [roleId, setRoleId] = useState(user.roleId);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const save = async () => {
    setSaving(true);
    try {
      await onSave(user.id, roleId);
      toast.success('Role updated');
      onClose();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  return (
    <Modal
      open
      onOpenChange={(v: boolean) => { if (!v) onClose(); }}
      title="Change Role"
      footer={
        <LoadingButton className="btn-brand" loading={saving} onClick={save}>
          Save
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Changing role for{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{user.username}</strong>
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Role
          </label>
          <TVSelect
            value={roleId}
            onValueChange={(v: string) => setRoleId(v)}
            options={roleOptions}
            placeholder="Select role…"
          />
        </div>
      </div>
    </Modal>
  );
}

// ── Row actions menu ─────────────────────────────────────────────────────────

interface RowActionsProps {
  row: OrgUser;
  roles: Role[];
  onChangeRole: (userId: string, roleId: string) => Promise<unknown>;
  onResetPassword: (userId: string, newPassword?: string) => Promise<{ tempPassword: string | null }>;
  onDeactivate: (userId: string) => Promise<void>;
}

function RowActions({ row, roles, onChangeRole, onResetPassword, onDeactivate }: RowActionsProps) {
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const toast = useToast();

  const handleDeactivate = async () => {
    try {
      await onDeactivate(row.id);
      toast.success(`${row.username} deactivated`);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  return (
    <>
      <Menu
        trigger={
          <button
            className="btn-ghost p-1.5"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            aria-label="Row actions"
          >
            <MoreHorizontal size={15} />
          </button>
        }
        align="end"
      >
        <MenuLabel>{row.username}</MenuLabel>
        <MenuSeparator />
        <MenuItem onSelect={() => setChangeRoleOpen(true)}>Change role</MenuItem>
        <MenuItem onSelect={() => setResetOpen(true)}>Reset password</MenuItem>
        {row.isActive && (
          <ConfirmDialog
            trigger={
              <button
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left"
                style={{ fontSize: 13, color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Deactivate
              </button>
            }
            title="Deactivate user?"
            description={`This will deactivate ${row.username}'s access. They will not be able to log in.`}
            confirmLabel="Deactivate"
            variant="destructive"
            onConfirm={handleDeactivate}
          />
        )}
      </Menu>

      {changeRoleOpen && (
        <ChangeRoleModal
          user={row}
          roles={roles}
          onClose={() => setChangeRoleOpen(false)}
          onSave={onChangeRole}
        />
      )}

      {resetOpen && (
        <ResetPasswordModal
          user={row}
          onClose={() => setResetOpen(false)}
          onReset={onResetPassword}
        />
      )}
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const {
    users,
    loading: usersLoading,
    error: usersError,
    refetch,
    inviteUser,
    changeUserRole,
    resetUserPassword,
    deactivateUser,
  } = useOrgUsers();
  const { roles, loading: rolesLoading } = useRoles();
  const toast = useToast();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState<InviteForm>(EMPTY_INVITE);
  const [submitting, setSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const rows = React.useMemo(
    () => (users as OrgUser[]).filter((u) => matchesSearch(u, ['username', 'email'], search)),
    [users, search],
  );

  const set = <K extends keyof InviteForm>(k: K, v: InviteForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openInviteModal = () => {
    setForm(EMPTY_INVITE);
    setInviteResult(null);
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    setSubmitting(true);
    try {
      const res = await inviteUser({
        email: form.email,
        username: form.username,
        roleId: form.roleId,
        password: form.password.trim() || undefined,
      });
      toast.success('User created');
      // Generated temp password → keep modal open to display it; admin-set → close.
      if (res.tempPassword) setInviteResult(res.tempPassword);
      else setInviteOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const loading = usersLoading || rolesLoading;
  const error = usersError;
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));

  const columns = [
    { key: 'username', header: 'Username' },
    {
      key: 'email',
      header: 'Email',
      render: (row: OrgUser) => <span className="font-mono">{row.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (row: OrgUser) =>
        row.role?.name ? (
          <Pill color="var(--accent-navy)">{row.role.name}</Pill>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>—</span>
        ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: OrgUser) =>
        row.isActive ? (
          <Pill color="var(--accent-teal)">Active</Pill>
        ) : (
          <Pill color="var(--text-muted)" bg="var(--bg-sunken)" border="var(--border-strong)">
            Inactive
          </Pill>
        ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (row: OrgUser) =>
        row.lastLoginAt ? (
          shortDate(row.lastLoginAt)
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>—</span>
        ),
    },
    {
      key: '_actions',
      header: '',
      width: 48,
      render: (row: OrgUser) => (
        <RowActions
          row={row}
          roles={roles}
          onChangeRole={changeUserRole}
          onResetPassword={resetUserPassword}
          onDeactivate={deactivateUser}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Team"
        breadcrumbs={['Admin', 'Team']}
        actions={
          <button className="btn-brand" onClick={openInviteModal}>
            Invite User
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={refetch} />}

      <SearchInput value={search} onChange={setSearch} placeholder="Search team…" />

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyLabel="No team members found"
        pageSize={10}
      />

      <Modal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite User"
        footer={
          inviteResult ? (
            <button className="btn-brand" onClick={() => setInviteOpen(false)}>Done</button>
          ) : (
            <LoadingButton
              className="btn-brand"
              loading={submitting}
              onClick={submitInvite}
            >
              Create User
            </LoadingButton>
          )
        }
      >
        {inviteResult ? (
          <CredentialPanel password={inviteResult} />
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                type="email"
                className="tv-input w-full font-mono"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Username
              </label>
              <input
                className="tv-input w-full"
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                placeholder="Display name"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Role
              </label>
              <TVSelect
                value={form.roleId}
                onValueChange={(v: string) => set('roleId', v)}
                options={roleOptions}
                placeholder="Select role…"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Password <span style={{ color: 'var(--text-dim)' }}>(optional)</span>
              </label>
              <input
                type="text"
                className="tv-input w-full font-mono"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Leave blank to auto-generate & email"
              />
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                Set a password (min 8 chars) for immediate use, or leave blank to generate a temporary one.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
