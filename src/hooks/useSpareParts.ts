import { useCallback, useEffect, useState } from 'react';
import * as sparePartsApi from '../api/spare-parts.api';
import { errMessage } from '../api/client';
import type { CreateSparePartBody, SparePart, StockAdjustmentBody } from '../types/api.types';

export function useSpareParts() {
  const [all, setAll] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sparePartsApi.getSpareParts();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load spare parts'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createSparePart = async (body: CreateSparePartBody) => {
    const part = await sparePartsApi.createSparePart(body);
    await refetch();
    return part;
  };

  const adjustStock = async (id: string, body: StockAdjustmentBody) => {
    const part = await sparePartsApi.adjustStock(id, body);
    await refetch();
    return part;
  };

  return { allParts: all, loading, error, refetch, createSparePart, adjustStock };
}
