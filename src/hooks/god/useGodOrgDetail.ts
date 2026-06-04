import { useCallback, useEffect, useState } from 'react';
import { getGodOrgDetailPage, type GodOrgDetailPage } from '../../api/god/pages.api';
import { godErr } from '../../api/god/client';

/** One-call God Mode org-detail (replaces ~7 separate platform calls). */
export function useGodOrgDetailPage(orgId: string | null) {
  const [data, setData] = useState<GodOrgDetailPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getGodOrgDetailPage(orgId));
    } catch (err) {
      setError(godErr(err, 'Failed to load organisation'));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
