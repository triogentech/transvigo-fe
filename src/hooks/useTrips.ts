import { useCallback, useEffect, useState } from 'react';
import * as tripsApi from '../api/trips.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateTripBody, Trip, TripFilters, TripStatus } from '../types/api.types';

function inRange(iso: string, from?: string, to?: string): boolean {
  if (from && iso < from) return false;
  if (to && iso > `${to}T23:59:59`) return false;
  return true;
}

/**
 * Reference hook pattern. Fetches all rows once (server has no filtering),
 * then filters + paginates client-side reacting to `filters`. Mutations call
 * the API then refetch.
 */
export function useTrips(initialFilters?: TripFilters) {
  const [all, setAll] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TripFilters>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tripsApi.getTrips();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load trips'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const predicate = (t: Trip) =>
    (!filters.status || t.currentStatus === filters.status) &&
    (!filters.driverId || t.driverId === filters.driverId) &&
    (!filters.vehicleId || t.vehicleId === filters.vehicleId) &&
    (!filters.loadProviderId || t.loadProviderId === filters.loadProviderId) &&
    (!filters.search || `${t.tripNumber} ${t.startPoint} ${t.endPoint}`.toLowerCase().includes(filters.search.toLowerCase())) &&
    inRange(t.createdAt, filters.dateFrom, filters.dateTo);

  const page = clientPage(all, predicate, filters.page ?? 1, filters.pageSize ?? 10);

  const createTrip = async (body: CreateTripBody) => {
    const trip = await tripsApi.createTrip(body);
    await refetch();
    return trip;
  };
  const updateTrip = async (id: string, body: Partial<CreateTripBody>) => {
    const trip = await tripsApi.updateTrip(id, body);
    await refetch();
    return trip;
  };
  const updateTripStatus = async (id: string, status: TripStatus) => {
    const trip = await tripsApi.updateTripStatus(id, status);
    await refetch();
    return trip;
  };
  const deleteTrip = async (id: string) => {
    await tripsApi.deleteTrip(id);
    await refetch();
  };

  return {
    trips: page.data, meta: page.meta, allTrips: all,
    loading, error, filters, setFilters, refetch,
    createTrip, updateTrip, updateTripStatus, deleteTrip,
  };
}

export function useTripById(id: string | null) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) { setTrip(null); return; }
    setLoading(true);
    setError(null);
    tripsApi.getTripById(id)
      .then(setTrip)
      .catch((e) => setError(errMessage(e, 'Failed to load trip')))
      .finally(() => setLoading(false));
  }, [id]);
  return { trip, loading, error };
}
