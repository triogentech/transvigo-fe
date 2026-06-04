import { useCallback, useEffect, useState } from 'react';
import { getGodDashboardPage, type GodDashboardPage } from '../../../api/god/pages.api';
import { godErr } from '../../../api/god/client';
import { usePageCacheListener } from '../../usePageCache';

const PAGE_PATH = '/platform/pages/dashboard';

export function useGodDashboard(): {
  data: GodDashboardPage | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [data, setData] = useState<GodDashboardPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getGodDashboardPage());
    } catch (err) {
      setError(godErr(err, 'Failed to load platform dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return { data, loading, error, refetch };
}
