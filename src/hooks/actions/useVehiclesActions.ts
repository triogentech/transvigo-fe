import { useCallback } from 'react';
import * as vehiclesApi from '../../api/vehicles.api';
import type { CreateVehicleBody } from '../../api/vehicles.api';
import { invalidatePageCache } from '../usePageCache';
import { clearSelectCache } from '../../api/select.api';

function invalidateVehicles(): void {
  invalidatePageCache('/api/pages/vehicles');
  invalidatePageCache('/api/pages/dashboard');
  clearSelectCache('vehicles');
}

export function useVehiclesActions() {
  const createVehicle = useCallback(
    async (body: CreateVehicleBody) => {
      const result = await vehiclesApi.createVehicle(body);
      invalidateVehicles();
      return result;
    },
    [],
  );

  const updateVehicle = useCallback(
    async (id: string, body: Partial<CreateVehicleBody>) => {
      const result = await vehiclesApi.updateVehicle(id, body);
      invalidateVehicles();
      return result;
    },
    [],
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      const result = await vehiclesApi.deleteVehicle(id);
      invalidateVehicles();
      return result;
    },
    [],
  );

  return { createVehicle, updateVehicle, deleteVehicle };
}
