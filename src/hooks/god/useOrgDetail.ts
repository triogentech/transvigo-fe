import { useCallback, useEffect, useState } from 'react';
import { getOrganisation } from '../../api/god/organisations.api';
import { godErr } from '../../api/god/client';
import type { OrgDetail } from '../../types/god.types';

export function useOrgDetail(orgId: string | null) {
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!orgId) { setOrg(null); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getOrganisation(orgId);
      setOrg(data);
    } catch (err) {
      setError(godErr(err, 'Failed to load organisation'));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { org, loading, error, refetch };
}
