import { useCallback, useEffect, useState } from 'react';
import * as fuelLogsApi from '../api/fuel-logs.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateFuelLogBody, FuelLog, PaginationParams } from '../types/api.types';

export interface FuelLogFilters extends PaginationParams {
  vehicleId?: string;
  tripId?: string;
  fuelStationId?: string;
}

export function useFuelLogs(initialFilters?: FuelLogFilters) {
  const [all, setAll] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FuelLogFilters>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fuelLogsApi.getFuelLogs();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load fuel logs'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const predicate = (f: FuelLog) =>
    (!filters.vehicleId || f.vehicleId === filters.vehicleId) &&
    (!filters.tripId || f.tripId === filters.tripId) &&
    (!filters.fuelStationId || f.fuelStationId === filters.fuelStationId);

  const page = clientPage(all, predicate, filters.page ?? 1, filters.pageSize ?? 10);

  const createFuelLog = async (body: CreateFuelLogBody) => {
    const fuelLog = await fuelLogsApi.createFuelLog(body);
    await refetch();
    return fuelLog;
  };
  const updateFuelLog = async (id: string, body: Partial<CreateFuelLogBody>) => {
    const fuelLog = await fuelLogsApi.updateFuelLog(id, body);
    await refetch();
    return fuelLog;
  };
  const deleteFuelLog = async (id: string) => {
    await fuelLogsApi.deleteFuelLog(id);
    await refetch();
  };

  return {
    fuelLogs: page.data, meta: page.meta, allFuelLogs: all,
    loading, error, filters, setFilters, refetch,
    createFuelLog, updateFuelLog, deleteFuelLog,
  };
}
