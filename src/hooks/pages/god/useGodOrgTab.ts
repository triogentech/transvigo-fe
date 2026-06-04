import { useCallback, useEffect, useState } from 'react';
import { getGodOrgDetailTab } from '../../../api/god/pages.api';
import { godErr } from '../../../api/god/client';
import { usePageCacheListener } from '../../usePageCache';

type TabMeta = { page: number; pageSize: number; total: number; totalPages: number };

const PAGE_PATH = '/platform/pages/org-detail';

export function useGodOrgTab(
  orgId: string | null,
  tab: string | null,
  params?: Record<string, unknown>,
): {
  data: unknown[];
  meta: TabMeta | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [result, setResult] = useState<{ data: unknown[]; meta: TabMeta } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId || !tab) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await getGodOrgDetailTab(orgId, tab, params));
    } catch (err) {
      setError(godErr(err, 'Failed to load tab data'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, tab, JSON.stringify(params)]);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return {
    data: result?.data ?? [],
    meta: result?.meta,
    loading,
    error,
    refetch,
  };
}
