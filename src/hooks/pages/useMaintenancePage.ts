import { useCallback, useEffect, useState } from 'react';
import { getMaintenancePage } from '../../api/pages.api';
import { errMessage } from '../../api/client';
import { usePageCacheListener } from '../usePageCache';
import type { PageMeta } from '../../api/pages.api';
import type { GarageLog, TyreLog } from '../../types/api.types';
import type { SelectOption } from '../../api/select.api';

type MaintenanceMeta = { garageLogsMeta: PageMeta; tyreLogsMeta: PageMeta };
type MaintenanceFilterOptions = { vehicles: SelectOption[]; garages: SelectOption[] };

const PAGE_PATH = '/api/pages/maintenance';

export function useMaintenancePage(initial?: Record<string, unknown>): {
  garageLogs: GarageLog[];
  tyreLogs: TyreLog[];
  meta: MaintenanceMeta | undefined;
  filterOptions: MaintenanceFilterOptions | undefined;
  summary: Record<string, number>;
  loading: boolean;
  error: string | null;
  filters: Record<string, unknown>;
  setFilters: (updates: Partial<Record<string, unknown>>) => void;
  refetch: () => void;
} {
  const [data, setData] = useState<{
    garageLogs: GarageLog[];
    tyreLogs: TyreLog[];
    meta: MaintenanceMeta;
    filters: MaintenanceFilterOptions;
    summary: Record<string, number>;
  } | null>(null);
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
      setData(await getMaintenancePage(filters));
    } catch (err) {
      setError(errMessage(err, 'Failed to load maintenance logs'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return {
    garageLogs: data?.garageLogs ?? [],
    tyreLogs: data?.tyreLogs ?? [],
    meta: data?.meta,
    filterOptions: data?.filters,
    summary: data?.summary ?? {},
    loading,
    error,
    filters,
    setFilters,
    refetch,
  };
}
