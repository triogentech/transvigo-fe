import { useCallback, useEffect, useState } from 'react';
import {
  getActiveImpersonations,
  startImpersonation,
  endImpersonation,
} from '../../api/god/impersonation.api';
import { godErr } from '../../api/god/client';
import type { ImpersonationSessionRow } from '../../types/god.types';

export function useImpersonation() {
  const [active, setActive] = useState<ImpersonationSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActiveImpersonations();
      setActive(data);
    } catch (err) {
      setError(godErr(err, 'Failed to load active impersonations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const start = async (orgId: string, targetUserId: string | undefined, reason: string): Promise<void> => {
    await startImpersonation(orgId, { targetUserId, reason });
    await refetch();
  };

  const end = async (sessionId: string): Promise<void> => {
    await endImpersonation(sessionId);
    await refetch();
  };

  return { active, loading, error, refetch, start, end };
}
