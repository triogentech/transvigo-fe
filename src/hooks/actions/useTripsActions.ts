import { useCallback } from 'react';
import * as tripsApi from '../../api/trips.api';
import type { CreateTripBody } from '../../api/trips.api';
import type { TripStatus } from '../../types/api.types';
import { invalidatePageCache } from '../usePageCache';
import { clearSelectCache } from '../../api/select.api';

function invalidateTrips(): void {
  invalidatePageCache('/api/pages/trips');
  invalidatePageCache('/api/pages/dashboard');
  clearSelectCache('trips');
}

export function useTripsActions() {
  const createTrip = useCallback(
    async (body: CreateTripBody) => {
      const result = await tripsApi.createTrip(body);
      invalidateTrips();
      return result;
    },
    [],
  );

  const updateTrip = useCallback(
    async (id: string, body: Partial<CreateTripBody>) => {
      const result = await tripsApi.updateTrip(id, body);
      invalidateTrips();
      return result;
    },
    [],
  );

  const updateTripStatus = useCallback(
    async (id: string, status: TripStatus) => {
      const result = await tripsApi.updateTripStatus(id, status);
      invalidateTrips();
      return result;
    },
    [],
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      const result = await tripsApi.deleteTrip(id);
      invalidateTrips();
      return result;
    },
    [],
  );

  return { createTrip, updateTrip, updateTripStatus, deleteTrip };
}
