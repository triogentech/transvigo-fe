import { useCallback } from 'react';
import * as tyreLogsApi from '../../api/tyre-logs.api';
import type { CreateTyreLogBody } from '../../api/tyre-logs.api';
import { invalidatePageCache } from '../usePageCache';

function invalidateTyreLogs(): void {
  invalidatePageCache('/api/pages/maintenance');
}

export function useTyreLogsActions() {
  const createTyreLog = useCallback(
    async (body: CreateTyreLogBody) => {
      const result = await tyreLogsApi.createTyreLog(body);
      invalidateTyreLogs();
      return result;
    },
    [],
  );

  const updateTyreLog = useCallback(
    async (id: string, body: Partial<CreateTyreLogBody>) => {
      const result = await tyreLogsApi.updateTyreLog(id, body);
      invalidateTyreLogs();
      return result;
    },
    [],
  );

  const deleteTyreLog = useCallback(
    async (id: string) => {
      const result = await tyreLogsApi.deleteTyreLog(id);
      invalidateTyreLogs();
      return result;
    },
    [],
  );

  return { createTyreLog, updateTyreLog, deleteTyreLog };
}
