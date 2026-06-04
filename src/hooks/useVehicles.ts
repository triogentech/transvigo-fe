import { useCallback, useEffect, useState } from 'react';
import * as vehiclesApi from '../api/vehicles.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateVehicleBody, Vehicle, VehicleFilters } from '../types/api.types';

export function useVehicles(initialFilters?: VehicleFilters) {
  const [all, setAll] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VehicleFilters>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await vehiclesApi.getVehicles();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load vehicles'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const predicate = (v: Vehicle) =>
    (!filters.currentStatus || v.currentStatus === filters.currentStatus) &&
    (filters.isActive === undefined || v.isActive === filters.isActive) &&
    (!filters.search || `${v.vehicleNumber} ${v.model ?? ''}`.toLowerCase().includes(filters.search.toLowerCase()));

  const page = clientPage(all, predicate, filters.page ?? 1, filters.pageSize ?? 10);

  const createVehicle = async (body: CreateVehicleBody) => {
    const vehicle = await vehiclesApi.createVehicle(body);
    await refetch();
    return vehicle;
  };
  const updateVehicle = async (id: string, body: Partial<CreateVehicleBody>) => {
    const vehicle = await vehiclesApi.updateVehicle(id, body);
    await refetch();
    return vehicle;
  };
  const deleteVehicle = async (id: string) => {
    await vehiclesApi.deleteVehicle(id);
    await refetch();
  };

  return {
    vehicles: page.data, meta: page.meta, allVehicles: all,
    loading, error, filters, setFilters, refetch,
    createVehicle, updateVehicle, deleteVehicle,
  };
}

export function useVehicleById(id: string | null) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) { setVehicle(null); return; }
    setLoading(true);
    setError(null);
    vehiclesApi.getVehicleById(id)
      .then(setVehicle)
      .catch((e) => setError(errMessage(e, 'Failed to load vehicle')))
      .finally(() => setLoading(false));
  }, [id]);
  return { vehicle, loading, error };
}
