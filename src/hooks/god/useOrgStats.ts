import { useCallback, useEffect, useState } from 'react';
import { getOrgStats } from '../../api/god/organisations.api';
import { godErr } from '../../api/god/client';
import type { OrgStats } from '../../types/god.types';

export function useOrgStats(orgId: string | null) {
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) { setStats(null); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getOrgStats(orgId);
      setStats(data);
    } catch (err) {
      setError(godErr(err, 'Failed to load organisation stats'));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { stats, loading, error, refetch };
}
