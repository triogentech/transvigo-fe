import { useCallback, useEffect, useState } from 'react';
import { getDriverDetailPage } from '../../api/pages.api';
import { errMessage } from '../../api/client';
import { usePageCacheListener } from '../usePageCache';
import type { Driver } from '../../types/api.types';
import type { TripListItem } from '../../api/pages.api';

type DriverDetail = {
  driver: Driver;
  user: { id: string; email: string } | null;
  recentTrips: TripListItem[];
  tripStats: {
    totalTrips: number;
    completedTrips: number;
    totalFreightHandled: number;
    avgFreightPerTrip: number;
  };
};

const PAGE_PATH = '/api/pages/drivers';

export function useDriverDetail(id: string | null): {
  detail: DriverDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [detail, setDetail] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await getDriverDetailPage(id));
    } catch (err) {
      setError(errMessage(err, 'Failed to load driver'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return { detail, loading, error, refetch };
}
