import { useCallback, useEffect, useState } from 'react';
import { getTripsPage, type TripsPage, type TripsPageParams } from '../api/pages.api';
import { errMessage } from '../api/client';

/**
 * One-call Trips page: trips + pagination + filter dropdowns + status counts.
 * Server-side filtered/paginated (the page endpoint honors these params), so
 * setFilters triggers a single refetch.
 */
export function useTripsPage(initial?: TripsPageParams) {
  const [data, setData] = useState<TripsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TripsPageParams>(initial ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getTripsPage(filters));
    } catch (err) {
      setError(errMessage(err, 'Failed to load trips'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);

  return {
    trips: data?.trips ?? [],
    meta: data?.meta,
    filterOptions: data?.filters,
    statusCounts: data?.statusCounts,
    loading, error, filters, setFilters, refetch,
  };
}
