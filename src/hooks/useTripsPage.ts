import { useCallback, useEffect, useRef, useState } from 'react';
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

  const latest = useRef(0);
  const refetch = useCallback(async () => {
    const mine = ++latest.current; // typing in a filter fires many requests: only the newest one may fill the page
    setLoading(true);
    setError(null);
    try {
      const res = await getTripsPage(filters);
      if (mine === latest.current) setData(res);
    } catch (err) {
      if (mine === latest.current) setError(errMessage(err, 'Failed to load trips'));
    } finally {
      if (mine === latest.current) setLoading(false);
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
