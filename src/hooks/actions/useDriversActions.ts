import { useCallback } from 'react';
import * as driversApi from '../../api/drivers.api';
import type { CreateDriverBody } from '../../api/drivers.api';
import { invalidatePageCache } from '../usePageCache';
import { clearSelectCache } from '../../api/select.api';

function invalidateDrivers(): void {
  invalidatePageCache('/api/pages/drivers');
  invalidatePageCache('/api/pages/vehicles'); // a vehicle's driver changes with it
  clearSelectCache('drivers');
  clearSelectCache('vehicles');
}

export function useDriversActions() {
  const createDriver = useCallback(
    async (body: CreateDriverBody) => {
      const result = await driversApi.createDriver(body);
      invalidateDrivers();
      return result;
    },
    [],
  );

  const updateDriver = useCallback(
    async (id: string, body: Partial<CreateDriverBody>) => {
      const result = await driversApi.updateDriver(id, body);
      invalidateDrivers();
      return result;
    },
    [],
  );

  const deleteDriver = useCallback(
    async (id: string) => {
      const result = await driversApi.deleteDriver(id);
      invalidateDrivers();
      return result;
    },
    [],
  );

  const assignVehicle = useCallback(
    async (id: string, vehicleId: string | null) => {
      const result = await driversApi.assignDriverVehicle(id, vehicleId);
      invalidateDrivers();
      return result;
    },
    [],
  );

  return { createDriver, updateDriver, deleteDriver, assignVehicle };
}
