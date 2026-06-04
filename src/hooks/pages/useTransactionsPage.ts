import { useCallback, useEffect, useState } from 'react';
import { getTransactionsPage } from '../../api/pages.api';
import { errMessage } from '../../api/client';
import { usePageCacheListener } from '../usePageCache';
import type { PageMeta } from '../../api/pages.api';
import type { Transaction, TxnTowards } from '../../types/api.types';
import type { SelectOption } from '../../api/select.api';

type TransactionRow = Transaction & {
  trip: { id: string; tripNumber: string; startPoint: string; endPoint: string } | null;
};

type TransactionsSummary = {
  totalDebits: number;
  totalCredits: number;
  netFlow: number;
  manualCount: number;
  byCategory: Array<{ txnTowards: TxnTowards; total: number; count: number }>;
};

type TransactionsFilterOptions = { trips: SelectOption[] };

const PAGE_PATH = '/api/pages/transactions';

export function useTransactionsPage(initial?: Record<string, unknown>): {
  transactions: TransactionRow[];
  meta: PageMeta | undefined;
  summary: TransactionsSummary | undefined;
  filterOptions: TransactionsFilterOptions | undefined;
  loading: boolean;
  error: string | null;
  filters: Record<string, unknown>;
  setFilters: (updates: Partial<Record<string, unknown>>) => void;
  refetch: () => void;
} {
  const [data, setData] = useState<{
    transactions: TransactionRow[];
    meta: PageMeta;
    summary: TransactionsSummary;
    filters: TransactionsFilterOptions;
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
      setData(await getTransactionsPage(filters));
    } catch (err) {
      setError(errMessage(err, 'Failed to load transactions'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return {
    transactions: data?.transactions ?? [],
    meta: data?.meta,
    summary: data?.summary,
    filterOptions: data?.filters,
    loading,
    error,
    filters,
    setFilters,
    refetch,
  };
}
