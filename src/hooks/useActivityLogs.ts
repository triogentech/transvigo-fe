import { useCallback, useEffect, useState } from 'react';
import * as activityLogsApi from '../api/activity-logs.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { ActivityLog, ActivityLogFilters } from '../types/api.types';

function inRange(iso: string, from?: string, to?: string): boolean {
  if (from && iso < from) return false;
  if (to && iso > `${to}T23:59:59`) return false;
  return true;
}

export function useActivityLogs(initialFilters?: ActivityLogFilters) {
  const [all, setAll] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityLogFilters>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await activityLogsApi.getActivityLogs();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load activity logs'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const predicate = (a: ActivityLog) =>
    (!filters.action || a.action === filters.action) &&
    (!filters.collection || a.collection === filters.collection) &&
    (!filters.performedBy || a.performedBy === filters.performedBy) &&
    inRange(a.createdAt, filters.dateFrom, filters.dateTo);

  const page = clientPage(all, predicate, filters.page ?? 1, filters.pageSize ?? 10);

  return {
    logs: page.data, meta: page.meta, allLogs: all,
    loading, error, filters, setFilters, refetch,
  };
}
