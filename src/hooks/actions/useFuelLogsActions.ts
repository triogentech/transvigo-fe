import { useCallback } from 'react';
import * as fuelLogsApi from '../../api/fuel-logs.api';
import type { CreateFuelLogBody } from '../../api/fuel-logs.api';
import { invalidatePageCache } from '../usePageCache';

function invalidateFuelLogs(): void {
  invalidatePageCache('/api/pages/fuel-logs');
}

export function useFuelLogsActions() {
  const createFuelLog = useCallback(
    async (body: CreateFuelLogBody) => {
      const result = await fuelLogsApi.createFuelLog(body);
      invalidateFuelLogs();
      return result;
    },
    [],
  );

  const updateFuelLog = useCallback(
    async (id: string, body: Partial<CreateFuelLogBody>) => {
      const result = await fuelLogsApi.updateFuelLog(id, body);
      invalidateFuelLogs();
      return result;
    },
    [],
  );

  const deleteFuelLog = useCallback(
    async (id: string) => {
      const result = await fuelLogsApi.deleteFuelLog(id);
      invalidateFuelLogs();
      return result;
    },
    [],
  );

  return { createFuelLog, updateFuelLog, deleteFuelLog };
}
