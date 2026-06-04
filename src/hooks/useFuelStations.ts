import { useCallback, useEffect, useState } from 'react';
import * as fuelStationsApi from '../api/fuel-stations.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateFuelStationBody, FuelStation, PaginationParams } from '../types/api.types';

export function useFuelStations(initialFilters?: PaginationParams) {
  const [all, setAll] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaginationParams>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fuelStationsApi.getFuelStations();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load fuel stations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const page = clientPage<FuelStation>(all, undefined, filters.page ?? 1, filters.pageSize ?? 10);

  const createFuelStation = async (body: CreateFuelStationBody) => {
    const fuelStation = await fuelStationsApi.createFuelStation(body);
    await refetch();
    return fuelStation;
  };
  const updateFuelStation = async (id: string, body: Partial<CreateFuelStationBody>) => {
    const fuelStation = await fuelStationsApi.updateFuelStation(id, body);
    await refetch();
    return fuelStation;
  };
  const deleteFuelStation = async (id: string) => {
    await fuelStationsApi.deleteFuelStation(id);
    await refetch();
  };

  return {
    fuelStations: page.data, meta: page.meta, allFuelStations: all,
    loading, error, filters, setFilters, refetch,
    createFuelStation, updateFuelStation, deleteFuelStation,
  };
}
