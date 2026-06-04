import { useCallback, useEffect, useState } from 'react';
import { getAuditLogs, type AuditLogParams } from '../../api/god/audit.api';
import { godErr } from '../../api/god/client';
import type { PlatformAuditEntry } from '../../types/god.types';
import type { PaginatedResponse } from '../../types/api.types';

type AuditMeta = PaginatedResponse<PlatformAuditEntry>['meta'];

export function usePlatformAudit(initial?: AuditLogParams) {
  const [logs, setLogs] = useState<PlatformAuditEntry[]>([]);
  const [meta, setMeta] = useState<AuditMeta>({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogParams>(initial ?? { page: 1, pageSize: 20 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditLogs(filters);
      setLogs(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(godErr(err, 'Failed to load audit logs'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { logs, meta, loading, error, filters, setFilters, refetch };
}
