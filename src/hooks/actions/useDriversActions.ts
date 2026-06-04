import { useCallback } from 'react';
import * as driversApi from '../../api/drivers.api';
import type { CreateDriverBody } from '../../api/drivers.api';
import { invalidatePageCache } from '../usePageCache';
import { clearSelectCache } from '../../api/select.api';

function invalidateDrivers(): void {
  invalidatePageCache('/api/pages/drivers');
  clearSelectCache('drivers');
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

  return { createDriver, updateDriver, deleteDriver };
}
