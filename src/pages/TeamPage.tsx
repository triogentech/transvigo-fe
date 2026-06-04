import React, { useState } from 'react';
import { useOrgUsers, useRoles } from '../hooks/useAdmin';
import { useToast } from '../context/ToastContext';
import { errMessage } from '../api/client';
import { shortDate } from '../lib/utils.js';
import type { OrgUser, Role } from '../types/api.types';
import { ErrorBanner, LoadingButton } from '../components/states';
import { MoreHorizontal } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as UIns from '../components/ui.jsx';
const UI = UIns as unknown as Record<string, any>;
const PageHeader: React.FC<any> = UI.PageHeader;
const DataTable: React.FC<any> = UI.DataTable;
const Modal: React.FC<any> = UI.Modal;
const Pill: React.FC<any> = UI.Pill;
const TVSelect: React.FC<any> = UI.TVSelect;
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
}

const EMPTY_INVITE: InviteForm = { email: '', username: '', roleId: '' };

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
  onDeactivate: (userId: string) => Promise<void>;
}

function RowActions({ row, roles, onChangeRole, onDeactivate }: RowActionsProps) {
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
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
    deactivateUser,
  } = useOrgUsers();
  const { roles, loading: rolesLoading } = useRoles();
  const toast = useToast();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState<InviteForm>(EMPTY_INVITE);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof InviteForm>(k: K, v: InviteForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const openInviteModal = () => {
    setForm(EMPTY_INVITE);
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    setSubmitting(true);
    try {
      await inviteUser({ email: form.email, username: form.username, roleId: form.roleId });
      toast.success('User invited');
      setInviteOpen(false);
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

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyLabel="No team members found"
        pageSize={10}
      />

      <Modal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite User"
        footer={
          <LoadingButton
            className="btn-brand"
            loading={submitting}
            onClick={submitInvite}
          >
            Send Invite
          </LoadingButton>
        }
      >
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
        </div>
      </Modal>
    </div>
  );
}
