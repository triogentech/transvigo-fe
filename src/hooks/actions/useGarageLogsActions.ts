import { useCallback } from 'react';
import * as garageLogsApi from '../../api/garage-logs.api';
import type { CreateGarageLogBody } from '../../api/garage-logs.api';
import { invalidatePageCache } from '../usePageCache';

function invalidateGarageLogs(): void {
  invalidatePageCache('/api/pages/maintenance');
}

export function useGarageLogsActions() {
  const createGarageLog = useCallback(
    async (body: CreateGarageLogBody) => {
      const result = await garageLogsApi.createGarageLog(body);
      invalidateGarageLogs();
      return result;
    },
    [],
  );

  const updateGarageLog = useCallback(
    async (id: string, body: Partial<CreateGarageLogBody>) => {
      const result = await garageLogsApi.updateGarageLog(id, body);
      invalidateGarageLogs();
      return result;
    },
    [],
  );

  const deleteGarageLog = useCallback(
    async (id: string) => {
      const result = await garageLogsApi.deleteGarageLog(id);
      invalidateGarageLogs();
      return result;
    },
    [],
  );

  const uploadInvoice = useCallback(
    async (id: string, file: File) => {
      const result = await garageLogsApi.uploadInvoice(id, file);
      invalidateGarageLogs();
      return result;
    },
    [],
  );

  return { createGarageLog, updateGarageLog, deleteGarageLog, uploadInvoice };
}
