import { useCallback } from 'react';
import * as tollLogsApi from '../../api/toll-logs.api';
import type { CreateTollLogBody } from '../../api/toll-logs.api';
import { invalidatePageCache } from '../usePageCache';

function invalidateTollLogs(): void {
  invalidatePageCache('/api/pages/trips');
}

export function useTollLogsActions() {
  const createTollLog = useCallback(
    async (body: CreateTollLogBody) => {
      const result = await tollLogsApi.createTollLog(body);
      invalidateTollLogs();
      return result;
    },
    [],
  );

  const updateTollLog = useCallback(
    async (id: string, body: Partial<CreateTollLogBody>) => {
      const result = await tollLogsApi.updateTollLog(id, body);
      invalidateTollLogs();
      return result;
    },
    [],
  );

  const deleteTollLog = useCallback(
    async (id: string) => {
      const result = await tollLogsApi.deleteTollLog(id);
      invalidateTollLogs();
      return result;
    },
    [],
  );

  return { createTollLog, updateTollLog, deleteTollLog };
}
