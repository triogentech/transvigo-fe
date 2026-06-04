import { useCallback, useEffect, useState } from 'react';
import * as garageLogsApi from '../api/garage-logs.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateGarageLogBody, GarageLog, PaginationParams } from '../types/api.types';

export interface GarageLogFilters extends PaginationParams {
  vehicleId?: string;
  garageId?: string;
}

export function useGarageLogs(initialFilters?: GarageLogFilters) {
  const [all, setAll] = useState<GarageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GarageLogFilters>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await garageLogsApi.getGarageLogs();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load garage logs'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const predicate = (g: GarageLog) =>
    (!filters.vehicleId || g.vehicleId === filters.vehicleId) &&
    (!filters.garageId || g.garageId === filters.garageId);

  const page = clientPage(all, predicate, filters.page ?? 1, filters.pageSize ?? 10);

  const createGarageLog = async (body: CreateGarageLogBody) => {
    const garageLog = await garageLogsApi.createGarageLog(body);
    await refetch();
    return garageLog;
  };
  const updateGarageLog = async (id: string, body: Partial<CreateGarageLogBody>) => {
    const garageLog = await garageLogsApi.updateGarageLog(id, body);
    await refetch();
    return garageLog;
  };
  const deleteGarageLog = async (id: string) => {
    await garageLogsApi.deleteGarageLog(id);
    await refetch();
  };

  return {
    garageLogs: page.data, meta: page.meta, allGarageLogs: all,
    loading, error, filters, setFilters, refetch,
    createGarageLog, updateGarageLog, deleteGarageLog,
  };
}

export function useGarageLogUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (id: string, file: File) => {
    setUploading(true);
    setError(null);
    try {
      return await garageLogsApi.uploadInvoice(id, file);
    } catch (err) {
      const msg = errMessage(err, 'Failed to upload invoice');
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
