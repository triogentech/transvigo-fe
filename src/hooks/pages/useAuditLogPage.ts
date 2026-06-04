import { useCallback, useEffect, useState } from 'react';
import { getAuditLogPage } from '../../api/pages.api';
import { errMessage } from '../../api/client';
import { usePageCacheListener } from '../usePageCache';
import type { PageMeta } from '../../api/pages.api';
import type { ActivityLog } from '../../types/api.types';
import type { SelectOption } from '../../api/select.api';

type AuditLogSummary = {
  totalToday: number;
  byAction: { CREATE: number; UPDATE: number; DELETE: number };
};

type AuditLogFilterOptions = { users: SelectOption[]; collections: string[] };

const PAGE_PATH = '/api/pages/audit-log';

export function useAuditLogPage(initial?: Record<string, unknown>): {
  logs: ActivityLog[];
  meta: PageMeta | undefined;
  filterOptions: AuditLogFilterOptions | undefined;
  summary: AuditLogSummary | undefined;
  loading: boolean;
  error: string | null;
  filters: Record<string, unknown>;
  setFilters: (updates: Partial<Record<string, unknown>>) => void;
  refetch: () => void;
} {
  const [data, setData] = useState<{
    logs: ActivityLog[];
    meta: PageMeta;
    filters: AuditLogFilterOptions;
    summary: AuditLogSummary;
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
      setData(await getAuditLogPage(filters));
    } catch (err) {
      setError(errMessage(err, 'Failed to load audit log'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return {
    logs: data?.logs ?? [],
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
