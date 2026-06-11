// API CALLS: 1 (GET /api/pages/admin/roles)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Circle,
  CreditCard,
  Disc,
  FileSearch,
  FileText,
  Fuel,
  Landmark,
  PackageSearch,
  Receipt,
  Route,
  Truck,
  User,
  UserCog,
  Users,
  Warehouse,
  Wrench,
  Zap,
} from 'lucide-react';
import { Card, PageHeader, TVSwitch } from '../components/ui.jsx';
import { LoadingButton, SkeletonTable, ErrorBanner } from '../components/states';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/utils.js';
import { useAdminRolesPage } from '../hooks/pages/useAdminRolesPage';
import { updateRolePermissions } from '../api/admin.api';

// ── Module icon map ──
const MODULE_ICON = {
  trips: Route,
  vehicles: Truck,
  drivers: Users,
  staff: UserCog,
  transactions: CreditCard,
  'toll-logs': Landmark,
  'fuel-stations': Zap,
  'fuel-logs': Fuel,
  garages: Warehouse,
  'garage-logs': FileText,
  'tyre-logs': Disc,
  cities: Building2,
  'load-providers': PackageSearch,
  users: User,
  'activity-logs': FileSearch,
  // Operations & Maintenance System
  tickets: AlertTriangle,
  'tyre-management': Circle,
  'job-cards': Wrench,
  'service-schedules': Calendar,
  'spare-parts': PackageSearch,
  'spare-vendors': Warehouse,
  'spare-inventory': FileText,
  invoices: Receipt,
};

// ── Module display name ──
function moduleName(slug) {
  const map = {
    trips: 'Trips',
    vehicles: 'Vehicles',
    drivers: 'Drivers',
    staff: 'Staff',
    transactions: 'Transactions',
    'toll-logs': 'Toll Logs',
    'fuel-stations': 'Fuel Stations',
    'fuel-logs': 'Fuel Logs',
    garages: 'Garages',
    'garage-logs': 'Maintenance / Work Orders',
    'tyre-logs': 'Tyre Logs',
    cities: 'Cities',
    'load-providers': 'Load Providers',
    users: 'Users',
    'activity-logs': 'Activity Logs',
    tickets: 'Tickets',
    'tyre-management': 'Tyre Management',
    'job-cards': 'Job Cards',
    'service-schedules': 'Service Schedules',
    'spare-parts': 'Spare Parts',
    'spare-vendors': 'Spare Vendors',
    'spare-inventory': 'Spare Issue Slips',
    invoices: 'Supplier Invoices',
  };
  return map[slug] || slug;
}

// ── Per-role left accent colors (match by role.name) ──
function roleAccent(name) {
  if (name === 'Admin')      return 'var(--gradient-brand)';
  if (name === 'Staff')      return 'var(--green)';
  if (name === 'Operations') return 'var(--teal)';
  if (name === 'Driver')     return 'var(--warning)';
  return 'var(--border-strong)';
}

const ACTIONS = [
  { key: 'canCreate', label: 'Create' },
  { key: 'canRead',   label: 'Read' },
  { key: 'canUpdate', label: 'Update' },
  { key: 'canDelete', label: 'Delete' },
];

// All module groups — kept as a constant so no mock import needed
const MODULE_GROUPS = [
  { group: 'OPERATIONS',   modules: ['trips', 'tickets', 'vehicles', 'drivers', 'staff'] },
  { group: 'FINANCE',      modules: ['transactions', 'toll-logs', 'invoices'] },
  { group: 'FLEET OPS',    modules: ['fuel-stations', 'fuel-logs', 'garages', 'garage-logs', 'tyre-logs', 'tyre-management'] },
  { group: 'WORKSHOP',     modules: ['job-cards', 'service-schedules', 'spare-parts', 'spare-vendors', 'spare-inventory'] },
  { group: 'MASTER DATA',  modules: ['cities', 'load-providers', 'users'] },
  { group: 'AUDIT',        modules: ['activity-logs'] },
];
const ALL_MODULES = MODULE_GROUPS.flatMap((g) => g.modules);

// ── Build a keyed permissions map from RolePermission[] ──
function buildPermsMap(permissions) {
  const map = {};
  for (const p of permissions) {
    map[p.module] = { canCreate: p.canCreate, canRead: p.canRead, canUpdate: p.canUpdate, canDelete: p.canDelete };
  }
  return map;
}

const FALSE_PERMS = { canCreate: false, canRead: false, canUpdate: false, canDelete: false };

export default function Roles() {
  const toast = useToast();

  // ── Single page data call ──
  const { roles, loading, error, refetch } = useAdminRolesPage();

  // ── Selected role id (default to first role once loaded) ──
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // ── Derive permissions from roles array for selected role ──
  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const loadedPermissions = selectedRole?.permissions ?? [];

  // ── Local edit state: map of module -> {canCreate, canRead, canUpdate, canDelete} ──
  const [localPerms, setLocalPerms] = useState({});
  const loadedRef = useRef({});
  const initializedFor = useRef(null);

  // Initialise local edit state once per selected role. Guarded by role id so
  // it doesn't re-run on every `roles` array identity change (which looped).
  useEffect(() => {
    if (!selectedRole || initializedFor.current === selectedRoleId) return;
    const map = buildPermsMap(selectedRole.permissions ?? []);
    setLocalPerms(map);
    loadedRef.current = map;
    initializedFor.current = selectedRoleId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoleId, selectedRole]);

  const isAdmin = selectedRole?.name === 'Admin';

  // ── Drift guard: surface any backend module that exists on a role but isn't in
  // MODULE_GROUPS, so a forgotten module is never hidden (or silently wiped on save). ──
  const extraModules = useMemo(() => {
    const known = new Set(ALL_MODULES);
    const found = new Set();
    for (const r of roles ?? []) {
      for (const p of r.permissions ?? []) {
        if (p?.module && !known.has(p.module)) found.add(p.module);
      }
    }
    return [...found].sort();
  }, [roles]);
  const displayGroups = useMemo(
    () => (extraModules.length ? [...MODULE_GROUPS, { group: 'OTHER', modules: extraModules }] : MODULE_GROUPS),
    [extraModules],
  );
  const effectiveModules = useMemo(() => [...ALL_MODULES, ...extraModules], [extraModules]);

  // ── Dirty check ──
  const dirty = useMemo(() => {
    if (isAdmin) return false;
    for (const mod of effectiveModules) {
      const local = localPerms[mod] || FALSE_PERMS;
      const loaded = loadedRef.current[mod] || FALSE_PERMS;
      for (const a of ['canCreate', 'canRead', 'canUpdate', 'canDelete']) {
        if (!!local[a] !== !!loaded[a]) return true;
      }
    }
    return false;
  }, [localPerms, isAdmin, effectiveModules]);

  function toggle(mod, actionKey) {
    setLocalPerms((prev) => ({
      ...prev,
      [mod]: {
        ...(prev[mod] || FALSE_PERMS),
        [actionKey]: !(prev[mod]?.[actionKey] ?? false),
      },
    }));
  }

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const payload = effectiveModules.map((mod) => {
        const p = localPerms[mod] || FALSE_PERMS;
        return {
          module: mod,
          canCreate: !!p.canCreate,
          canRead: !!p.canRead,
          canUpdate: !!p.canUpdate,
          canDelete: !!p.canDelete,
        };
      });
      await updateRolePermissions(selectedRoleId, payload);
      await refetch();
      loadedRef.current = { ...localPerms };
      toast.success(`Permissions updated for ${selectedRole.name}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setLocalPerms({ ...loadedRef.current });
  }

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <PageHeader title="ROLES & PERMISSIONS" breadcrumbs={['Admin', 'Roles & Perms']} />
        <div className="mt-5">
          <SkeletonTable rows={6} cols={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fadeIn">
        <PageHeader title="ROLES & PERMISSIONS" breadcrumbs={['Admin', 'Roles & Perms']} />
        <div className="mt-5">
          <ErrorBanner message={error} onRetry={refetch} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="ROLES & PERMISSIONS"
        breadcrumbs={['Admin', 'Roles & Perms']}
      />

      {/* Two-panel layout */}
      <div className="flex gap-4 mt-5" style={{ alignItems: 'flex-start' }}>
        {/* LEFT: Role list */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div className="uppercase tracking-widest mb-2" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
            ROLES
          </div>
          <div className="flex flex-col gap-2">
            {roles.map((role) => {
                  const active = selectedRoleId === role.id;
                  const accent = roleAccent(role.name);
                  const isGradient = accent === 'var(--gradient-brand)';
                  return (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRoleId(role.id)}
                      className={cx('tv-card p-3 cursor-pointer transition-all')}
                      style={{
                        background: active ? 'var(--navy-mid)' : 'var(--navy-base)',
                        border: `1px solid ${active ? 'var(--border-active)' : 'var(--border)'}`,
                        borderLeft: isGradient ? '3px solid transparent' : `3px solid ${accent}`,
                        ...(isGradient && { borderImage: 'var(--gradient-brand) 1' }),
                      }}
                    >
                      <div className="font-display font-semibold" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                        {role.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        <span>{role._count?.users ?? 0} user{(role._count?.users ?? 0) !== 1 ? 's' : ''}</span>
                        {role.isSystem && (
                          <span
                            className="font-display uppercase"
                            style={{ fontSize: 9, background: 'var(--navy-light)', color: 'var(--text-muted)', padding: '1px 5px', borderRadius: 3 }}
                          >
                            SYSTEM
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* RIGHT: Permissions panel */}
        <div className="flex-1 min-w-0">
          <Card className="p-0 overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <span className="font-display font-semibold" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
                {selectedRole?.name ?? '…'} Permissions
              </span>
              {!isAdmin && (
                <div className="flex items-center gap-2">
                  {dirty && (
                    <button
                      className="btn-ghost px-3 py-1.5"
                      style={{ fontSize: 13 }}
                      onClick={handleDiscard}
                      disabled={saving}
                    >
                      Discard
                    </button>
                  )}
                  <LoadingButton
                    className="btn-brand px-4 py-1.5"
                    style={{ fontSize: 13 }}
                    disabled={!dirty}
                    loading={saving}
                    onClick={handleSave}
                  >
                    Save Changes
                  </LoadingButton>
                </div>
              )}
            </div>

            {/* Admin read-only banner */}
            {isAdmin && (
              <div
                className="mx-4 mt-4 rounded p-3"
                style={{ background: 'rgba(14,165,197,0.08)', border: '1px solid var(--border-active)', fontSize: 13, color: 'var(--text-muted)' }}
              >
                Admin has unrestricted access to all modules. Permissions cannot be modified.
              </div>
            )}

            {/* Column labels */}
            <div className="flex items-center px-4 pt-4 pb-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 200, flexShrink: 0 }} />
              {ACTIONS.map((a) => (
                <div
                  key={a.key}
                  className="uppercase tracking-wider text-center"
                  style={{ width: 72, fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}
                >
                  {a.label}
                </div>
              ))}
            </div>

            {/* Module permission matrix */}
            <div className="px-4 pb-4">
                {displayGroups.map((grp) => (
                  <div key={grp.group}>
                    {/* Group label */}
                    <div
                      className="uppercase tracking-widest my-3"
                      style={{ fontSize: 10, color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}
                    >
                      {grp.group}
                    </div>

                    {/* Module rows */}
                    {grp.modules.map((slug) => {
                      const Icon = MODULE_ICON[slug] || FileText;
                      const perms = localPerms[slug] || FALSE_PERMS;
                      return (
                        <div
                          key={slug}
                          className="flex items-center py-1.5"
                          style={{ borderBottom: '1px solid rgba(14,165,197,0.05)' }}
                        >
                          {/* Module name */}
                          <div className="flex items-center gap-2" style={{ width: 200, flexShrink: 0 }}>
                            <Icon size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                            <span className="font-display font-semibold" style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                              {moduleName(slug)}
                            </span>
                          </div>

                          {/* Switches */}
                          {ACTIONS.map((a) => (
                            <div key={a.key} className="flex justify-center" style={{ width: 72, flexShrink: 0 }}>
                              <TVSwitch
                                checked={isAdmin ? true : !!perms[a.key]}
                                onCheckedChange={isAdmin ? undefined : () => toggle(slug, a.key)}
                                disabled={isAdmin}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
