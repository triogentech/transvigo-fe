import { useCallback, useEffect, useState } from 'react';
import * as loadProvidersApi from '../api/load-providers.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateLoadProviderBody, LoadProvider, PaginationParams } from '../types/api.types';

export function useLoadProviders(initialFilters?: PaginationParams) {
  const [all, setAll] = useState<LoadProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaginationParams>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loadProvidersApi.getLoadProviders();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load load providers'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const page = clientPage<LoadProvider>(all, undefined, filters.page ?? 1, filters.pageSize ?? 10);

  const createLoadProvider = async (body: CreateLoadProviderBody) => {
    const loadProvider = await loadProvidersApi.createLoadProvider(body);
    await refetch();
    return loadProvider;
  };
  const updateLoadProvider = async (id: string, body: Partial<CreateLoadProviderBody>) => {
    const loadProvider = await loadProvidersApi.updateLoadProvider(id, body);
    await refetch();
    return loadProvider;
  };
  const deleteLoadProvider = async (id: string) => {
    await loadProvidersApi.deleteLoadProvider(id);
    await refetch();
  };

  return {
    loadProviders: page.data, meta: page.meta, allLoadProviders: all,
    loading, error, filters, setFilters, refetch,
    createLoadProvider, updateLoadProvider, deleteLoadProvider,
  };
}
