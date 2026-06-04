import { useCallback, useEffect, useState } from 'react';
import * as tyreLogsApi from '../api/tyre-logs.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateTyreLogBody, PaginationParams, TyreLog } from '../types/api.types';

export interface TyreLogFilters extends PaginationParams {
  vehicleId?: string;
}

export function useTyreLogs(initialFilters?: TyreLogFilters) {
  const [all, setAll] = useState<TyreLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TyreLogFilters>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tyreLogsApi.getTyreLogs();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load tyre logs'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const predicate = (t: TyreLog) =>
    (!filters.vehicleId || t.vehicleId === filters.vehicleId);

  const page = clientPage(all, predicate, filters.page ?? 1, filters.pageSize ?? 10);

  const createTyreLog = async (body: CreateTyreLogBody) => {
    const tyreLog = await tyreLogsApi.createTyreLog(body);
    await refetch();
    return tyreLog;
  };
  const updateTyreLog = async (id: string, body: Partial<CreateTyreLogBody>) => {
    const tyreLog = await tyreLogsApi.updateTyreLog(id, body);
    await refetch();
    return tyreLog;
  };
  const deleteTyreLog = async (id: string) => {
    await tyreLogsApi.deleteTyreLog(id);
    await refetch();
  };

  return {
    tyreLogs: page.data, meta: page.meta, allTyreLogs: all,
    loading, error, filters, setFilters, refetch,
    createTyreLog, updateTyreLog, deleteTyreLog,
  };
}
