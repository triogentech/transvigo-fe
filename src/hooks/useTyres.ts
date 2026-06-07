import { useCallback, useEffect, useState } from 'react';
import * as tyresApi from '../api/tyres.api';
import { errMessage } from '../api/client';
import type { CreateTyreBody, CreateTyreMovementBody, Tyre } from '../types/api.types';

export function useTyres() {
  const [all, setAll] = useState<Tyre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tyresApi.getTyres();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load tyres'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createTyre = async (body: CreateTyreBody) => {
    const t = await tyresApi.createTyre(body);
    await refetch();
    return t;
  };

  const addMovement = async (id: string, body: CreateTyreMovementBody) => {
    const t = await tyresApi.addMovement(id, body);
    await refetch();
    return t;
  };

  return { allTyres: all, loading, error, refetch, createTyre, addMovement };
}
