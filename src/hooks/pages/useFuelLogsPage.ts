import { useCallback, useEffect, useState } from 'react';
import { getFuelLogsPage } from '../../api/pages.api';
import { errMessage } from '../../api/client';
import { usePageCacheListener } from '../usePageCache';
import type { PageMeta } from '../../api/pages.api';
import type { FuelLog } from '../../types/api.types';
import type { SelectOption } from '../../api/select.api';

type FuelLogsSummary = {
  totalLitres: number;
  totalCost: number;
  avgRatePerLitre: number;
  byFuelType: Array<{ fuelType: string; litres: number; cost: number }>;
};

type FuelLogsFilterOptions = { vehicles: SelectOption[]; fuelStations: SelectOption[] };

const PAGE_PATH = '/api/pages/fuel-logs';

export function useFuelLogsPage(initial?: Record<string, unknown>): {
  fuelLogs: FuelLog[];
  meta: PageMeta | undefined;
  filterOptions: FuelLogsFilterOptions | undefined;
  summary: FuelLogsSummary | undefined;
  loading: boolean;
  error: string | null;
  filters: Record<string, unknown>;
  setFilters: (updates: Partial<Record<string, unknown>>) => void;
  refetch: () => void;
} {
  const [data, setData] = useState<{
    fuelLogs: FuelLog[];
    meta: PageMeta;
    filters: FuelLogsFilterOptions;
    summary: FuelLogsSummary;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<Record<string, unknown>>(initial ?? { page: 1, pageSize: 10 });

  const setFilters = useCallback((updates: Partial<Record<string, unknown>>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getFuelLogsPage(filters));
    } catch (err) {
      setError(errMessage(err, 'Failed to load fuel logs'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return {
    fuelLogs: data?.fuelLogs ?? [],
    meta: data?.meta,
    filterOptions: data?.filters,
    summary: data?.summary,
    loading,
    error,
    filters,
    setFilters,
    refetch,
  };
}
