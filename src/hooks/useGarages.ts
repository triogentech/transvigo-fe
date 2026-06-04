import { useCallback, useEffect, useState } from 'react';
import * as garagesApi from '../api/garages.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateGarageBody, Garage, PaginationParams } from '../types/api.types';

export function useGarages(initialFilters?: PaginationParams) {
  const [all, setAll] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaginationParams>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await garagesApi.getGarages();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load garages'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const page = clientPage<Garage>(all, undefined, filters.page ?? 1, filters.pageSize ?? 10);

  const createGarage = async (body: CreateGarageBody) => {
    const garage = await garagesApi.createGarage(body);
    await refetch();
    return garage;
  };
  const updateGarage = async (id: string, body: Partial<CreateGarageBody>) => {
    const garage = await garagesApi.updateGarage(id, body);
    await refetch();
    return garage;
  };
  const deleteGarage = async (id: string) => {
    await garagesApi.deleteGarage(id);
    await refetch();
  };

  return {
    garages: page.data, meta: page.meta, allGarages: all,
    loading, error, filters, setFilters, refetch,
    createGarage, updateGarage, deleteGarage,
  };
}
