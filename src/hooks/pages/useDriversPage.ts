import { useCallback, useEffect, useState } from 'react';
import { getDriversPage } from '../../api/pages.api';
import { errMessage } from '../../api/client';
import { usePageCacheListener } from '../usePageCache';
import type { PageMeta } from '../../api/pages.api';
import type { Driver } from '../../types/api.types';

type DriverRow = Driver & Record<string, unknown>;

const PAGE_PATH = '/api/pages/drivers';

export function useDriversPage(initial?: Record<string, unknown>): {
  drivers: DriverRow[];
  meta: PageMeta | undefined;
  summary: Record<string, number>;
  loading: boolean;
  error: string | null;
  filters: Record<string, unknown>;
  setFilters: (updates: Partial<Record<string, unknown>>) => void;
  refetch: () => void;
} {
  const [data, setData] = useState<{ drivers: DriverRow[]; meta: PageMeta; summary: Record<string, number> } | null>(null);
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
      setData(await getDriversPage(filters));
    } catch (err) {
      setError(errMessage(err, 'Failed to load drivers'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return {
    drivers: data?.drivers ?? [],
    meta: data?.meta,
    summary: data?.summary ?? {},
    loading,
    error,
    filters,
    setFilters,
    refetch,
  };
}
