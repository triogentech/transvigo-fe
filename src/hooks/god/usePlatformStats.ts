import { useCallback, useEffect, useState } from 'react';
import { getPlatformStats } from '../../api/god/stats.api';
import { godErr } from '../../api/god/client';
import type { PlatformStats } from '../../types/god.types';

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlatformStats();
      setStats(data);
    } catch (err) {
      setError(godErr(err, 'Failed to load platform stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  return { stats, loading, error, refetch };
}
