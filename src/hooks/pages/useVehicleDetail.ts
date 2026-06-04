import { useCallback, useEffect, useState } from 'react';
import { getVehicleDetailPage } from '../../api/pages.api';
import { errMessage } from '../../api/client';
import { usePageCacheListener } from '../usePageCache';
import type { Vehicle, Trip, FuelLog, GarageLog, TyreLog } from '../../types/api.types';
import type { TripListItem } from '../../api/pages.api';

type VehicleDetail = {
  vehicle: Vehicle;
  currentTrip: Trip | null;
  recentTrips: TripListItem[];
  fuelLogs: FuelLog[];
  garageLogs: GarageLog[];
  tyreLogs: TyreLog[];
  complianceStatus: Array<{ field: string; label: string; date: string; daysLeft: number; status: string }>;
};

const PAGE_PATH = '/api/pages/vehicles';

export function useVehicleDetail(id: string | null): {
  detail: VehicleDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [detail, setDetail] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await getVehicleDetailPage(id));
    } catch (err) {
      setError(errMessage(err, 'Failed to load vehicle'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void refetch(); }, [refetch]);
  usePageCacheListener(PAGE_PATH, refetch);

  return { detail, loading, error, refetch };
}
