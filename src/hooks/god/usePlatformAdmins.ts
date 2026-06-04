import { useCallback, useEffect, useState } from 'react';
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  type CreateAdminBody,
  type UpdateAdminBody,
} from '../../api/god/admins.api';
import { godErr } from '../../api/god/client';
import type { PlatformAdminPublic } from '../../types/god.types';

export function usePlatformAdmins() {
  const [admins, setAdmins] = useState<PlatformAdminPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch (err) {
      setError(godErr(err, 'Failed to load platform admins'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const createAdminFn = async (body: CreateAdminBody): Promise<PlatformAdminPublic> => {
    const admin = await createAdmin(body);
    await refetch();
    return admin;
  };

  const updateAdminFn = async (adminId: string, body: UpdateAdminBody): Promise<PlatformAdminPublic> => {
    const admin = await updateAdmin(adminId, body);
    await refetch();
    return admin;
  };

  const deleteAdminFn = async (adminId: string): Promise<void> => {
    await deleteAdmin(adminId);
    await refetch();
  };

  return {
    admins,
    loading,
    error,
    refetch,
    createAdmin: createAdminFn,
    updateAdmin: updateAdminFn,
    deleteAdmin: deleteAdminFn,
  };
}
