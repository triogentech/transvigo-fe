import { useCallback, useEffect, useState } from 'react';
import { getDashboardPage, type DashboardPage } from '../api/pages.api';
import { errMessage } from '../api/client';

/** One-call Dashboard data (replaces the old 3-fetch + client-aggregate hook). */
export function useDashboardPage() {
  const [data, setData] = useState<DashboardPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getDashboardPage());
    } catch (err) {
      setError(errMessage(err, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
