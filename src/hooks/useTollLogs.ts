import { useCallback, useEffect, useState } from 'react';
import * as tollLogsApi from '../api/toll-logs.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateTollLogBody, PaginationParams, TollLog } from '../types/api.types';

export function useTollLogs(initialFilters?: PaginationParams) {
  const [all, setAll] = useState<TollLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaginationParams>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tollLogsApi.getTollLogs();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load toll logs'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const page = clientPage<TollLog>(all, undefined, filters.page ?? 1, filters.pageSize ?? 10);

  const createTollLog = async (body: CreateTollLogBody) => {
    const tollLog = await tollLogsApi.createTollLog(body);
    await refetch();
    return tollLog;
  };
  const updateTollLog = async (id: string, body: Partial<CreateTollLogBody>) => {
    const tollLog = await tollLogsApi.updateTollLog(id, body);
    await refetch();
    return tollLog;
  };
  const deleteTollLog = async (id: string) => {
    await tollLogsApi.deleteTollLog(id);
    await refetch();
  };

  return {
    tollLogs: page.data, meta: page.meta, allTollLogs: all,
    loading, error, filters, setFilters, refetch,
    createTollLog, updateTollLog, deleteTollLog,
  };
}
