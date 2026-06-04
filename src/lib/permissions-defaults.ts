import type { ModuleSlug, PermissionAction } from '../types/api.types';

// Mirrors transvigo-be's seeded default permission matrix. Used for client-side
// gating (nav visibility, route guards). The server always enforces the real
// permissions; non-Admin users cannot read the admin permissions endpoint, so
// the four SYSTEM roles fall back to these known defaults. Admin = all true and
// the Roles page fetches/edits live permissions via the admin API.
type Bits = Record<PermissionAction, boolean>;
const crud = (c: boolean, r: boolean, u: boolean, d: boolean): Bits => ({
  canCreate: c, canRead: r, canUpdate: u, canDelete: d,
});
const FULL = crud(true, true, true, true);
const R = crud(false, true, false, false);
const RU = crud(false, true, true, false);
const CR = crud(true, true, false, false);
const NONE = crud(false, false, false, false);

const ALL_MODULES: ModuleSlug[] = [
  'trips', 'vehicles', 'drivers', 'staff', 'load-providers', 'transactions',
  'fuel-stations', 'fuel-logs', 'garages', 'garage-logs', 'tyre-logs',
  'toll-logs', 'activity-logs', 'cities', 'users',
];

function build(partial: Partial<Record<ModuleSlug, Bits>>): Record<ModuleSlug, Bits> {
  const out = {} as Record<ModuleSlug, Bits>;
  for (const m of ALL_MODULES) out[m] = partial[m] ?? NONE;
  return out;
}

export const DEFAULT_PERMISSIONS: Record<string, Record<ModuleSlug, Bits>> = {
  Admin: build(Object.fromEntries(ALL_MODULES.map((m) => [m, FULL])) as Record<ModuleSlug, Bits>),
  Staff: build({
    cities: R, 'fuel-stations': FULL, garages: FULL, 'fuel-logs': FULL,
    'garage-logs': FULL, 'tyre-logs': FULL, transactions: FULL,
    'activity-logs': R, drivers: R, vehicles: R, staff: FULL,
    'load-providers': R, users: R,
  }),
  Operations: build({
    trips: FULL, vehicles: RU, drivers: R, 'load-providers': R,
    'fuel-logs': CR, 'toll-logs': FULL, cities: R,
  }),
  Driver: build({ trips: R, drivers: R }),
};
