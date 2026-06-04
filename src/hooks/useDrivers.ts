import { useCallback, useEffect, useState } from 'react';
import * as driversApi from '../api/drivers.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateDriverBody, Driver, DriverFilters } from '../types/api.types';

export function useDrivers(initialFilters?: DriverFilters) {
  const [all, setAll] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DriverFilters>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await driversApi.getDrivers();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load drivers'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const predicate = (d: Driver) =>
    (!filters.currentStatus || d.currentStatus === filters.currentStatus) &&
    (!filters.search || `${d.fullName} ${d.contactNumber}`.toLowerCase().includes(filters.search.toLowerCase()));

  const page = clientPage(all, predicate, filters.page ?? 1, filters.pageSize ?? 10);

  const createDriver = async (body: CreateDriverBody) => {
    const driver = await driversApi.createDriver(body);
    await refetch();
    return driver;
  };
  const updateDriver = async (id: string, body: Partial<CreateDriverBody>) => {
    const driver = await driversApi.updateDriver(id, body);
    await refetch();
    return driver;
  };
  const deleteDriver = async (id: string) => {
    await driversApi.deleteDriver(id);
    await refetch();
  };

  return {
    drivers: page.data, meta: page.meta, allDrivers: all,
    loading, error, filters, setFilters, refetch,
    createDriver, updateDriver, deleteDriver,
  };
}

export function useDriverById(id: string | null) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) { setDriver(null); return; }
    setLoading(true);
    setError(null);
    driversApi.getDriverById(id)
      .then(setDriver)
      .catch((e) => setError(errMessage(e, 'Failed to load driver')))
      .finally(() => setLoading(false));
  }, [id]);
  return { driver, loading, error };
}
