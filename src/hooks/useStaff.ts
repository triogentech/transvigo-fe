import { useCallback, useEffect, useState } from 'react';
import * as staffApi from '../api/staff.api';
import { clientPage } from '../lib/clientList';
import { errMessage } from '../api/client';
import type { CreateStaffBody, PaginationParams, Staff } from '../types/api.types';

export function useStaff(initialFilters?: PaginationParams) {
  const [all, setAll] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaginationParams>(initialFilters ?? { page: 1, pageSize: 10 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await staffApi.getStaff();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load staff'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const page = clientPage<Staff>(all, undefined, filters.page ?? 1, filters.pageSize ?? 10);

  const createStaff = async (body: CreateStaffBody) => {
    const staff = await staffApi.createStaff(body);
    await refetch();
    return staff;
  };
  const updateStaff = async (id: string, body: Partial<CreateStaffBody>) => {
    const staff = await staffApi.updateStaff(id, body);
    await refetch();
    return staff;
  };
  const deleteStaff = async (id: string) => {
    await staffApi.deleteStaff(id);
    await refetch();
  };

  return {
    staff: page.data, meta: page.meta, allStaff: all,
    loading, error, filters, setFilters, refetch,
    createStaff, updateStaff, deleteStaff,
  };
}

export function useStaffById(id: string | null) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) { setStaff(null); return; }
    setLoading(true);
    setError(null);
    staffApi.getStaffById(id)
      .then(setStaff)
      .catch((e) => setError(errMessage(e, 'Failed to load staff member')))
      .finally(() => setLoading(false));
  }, [id]);
  return { staff, loading, error };
}
