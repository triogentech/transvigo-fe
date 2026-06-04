import { useCallback, useEffect, useState } from 'react';
import { getAdminRolesPage } from '../../api/pages.api';
import { errMessage } from '../../api/client';
import { usePageCacheListener } from '../usePageCache';
import type { Role, RolePermission } from '../../types/api.types';

type RoleWithDetails = Role & { _count: { users: number }; permissions: RolePermission[] };
type ModuleEntry = { slug: string; label: string; group: string; icon: string };

const PAGE_PATH = '/api/pages/admin/roles';

export function useAdminRolesPage(): {
  roles: RoleWithDetails[];
  modules: ModuleEntry[];
  orgUserCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<{
    roles: RoleWithDetails[];
    modules: ModuleEntry[];
    orgUserCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAdminRolesPage());
    } catch (err) {
      setError(errMessage(err, 'Failed to load roles'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return {
    roles: data?.roles ?? [],
    modules: data?.modules ?? [],
    orgUserCount: data?.orgUserCount ?? 0,
    loading,
    error,
    refetch,
  };
}
