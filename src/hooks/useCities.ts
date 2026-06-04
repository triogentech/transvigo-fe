import { useCallback, useEffect, useState } from 'react';
import * as citiesApi from '../api/cities.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { City, CreateCityBody, PaginationParams } from '../types/api.types';

export function useCities(initialFilters?: PaginationParams) {
  const [all, setAll] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaginationParams>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await citiesApi.getCities();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load cities'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const page = clientPage<City>(all, undefined, filters.page ?? 1, filters.pageSize ?? 10);

  const createCity = async (body: CreateCityBody) => {
    const city = await citiesApi.createCity(body);
    await refetch();
    return city;
  };
  const updateCity = async (id: string, body: Partial<CreateCityBody>) => {
    const city = await citiesApi.updateCity(id, body);
    await refetch();
    return city;
  };
  const deleteCity = async (id: string) => {
    await citiesApi.deleteCity(id);
    await refetch();
  };

  return {
    cities: page.data, meta: page.meta, allCities: all,
    loading, error, filters, setFilters, refetch,
    createCity, updateCity, deleteCity,
  };
}
