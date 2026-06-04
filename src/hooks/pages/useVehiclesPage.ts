import { useCallback, useEffect, useState } from 'react';
import { getVehiclesPage } from '../../api/pages.api';
import { errMessage } from '../../api/client';
import { usePageCacheListener } from '../usePageCache';
import type { PageMeta } from '../../api/pages.api';
import type { Vehicle } from '../../types/api.types';

type VehiclesPageData = Awaited<ReturnType<typeof getVehiclesPage>>;
type VehicleRow = Vehicle & Record<string, unknown>;

const PAGE_PATH = '/api/pages/vehicles';

export function useVehiclesPage(initial?: Record<string, unknown>): {
  vehicles: VehicleRow[];
  meta: PageMeta | undefined;
  summary: Record<string, number>;
  complianceOverview: { critical: number; warning: number; healthy: number } | undefined;
  loading: boolean;
  error: string | null;
  filters: Record<string, unknown>;
  setFilters: (updates: Partial<Record<string, unknown>>) => void;
  refetch: () => void;
} {
  const [data, setData] = useState<VehiclesPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<Record<string, unknown>>(initial ?? { page: 1, pageSize: 10 });

  const setFilters = useCallback((updates: Partial<Record<string, unknown>>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getVehiclesPage(filters));
    } catch (err) {
      setError(errMessage(err, 'Failed to load vehicles'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return {
    vehicles: data?.vehicles ?? [],
    meta: data?.meta,
    summary: data?.summary ?? {},
    complianceOverview: data?.complianceOverview,
    loading,
    error,
    filters,
    setFilters,
    refetch,
  };
}
