import { useCallback, useEffect, useState } from 'react';
import { getGodOrgsPage, type GodOrgsPage } from '../../../api/god/pages.api';
import { godErr } from '../../../api/god/client';
import { usePageCacheListener } from '../../usePageCache';

const PAGE_PATH = '/platform/pages/organisations';

export function useGodOrgsPage(initial?: Record<string, unknown>): {
  organisations: GodOrgsPage['organisations'];
  meta: GodOrgsPage['meta'] | undefined;
  summary: GodOrgsPage['summary'] | undefined;
  loading: boolean;
  error: string | null;
  filters: Record<string, unknown>;
  setFilters: (updates: Partial<Record<string, unknown>>) => void;
  refetch: () => void;
} {
  const [data, setData] = useState<GodOrgsPage | null>(null);
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
      setData(await getGodOrgsPage(filters));
    } catch (err) {
      setError(godErr(err, 'Failed to load organisations'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return {
    organisations: data?.organisations ?? [],
    meta: data?.meta,
    summary: data?.summary,
    loading,
    error,
    filters,
    setFilters,
    refetch,
  };
}
