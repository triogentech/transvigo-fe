import { useCallback, useEffect, useState } from 'react';
import {
  getOrganisations,
  suspendOrganisation,
  reactivateOrganisation,
  deleteOrganisation,
  type OrgListParams,
} from '../../api/god/organisations.api';
import { godErr } from '../../api/god/client';
import type { OrgWithStats } from '../../types/god.types';
import type { PaginatedResponse } from '../../types/api.types';

type OrgMeta = PaginatedResponse<OrgWithStats>['meta'];

export function useOrganisations(initial?: OrgListParams) {
  const [orgs, setOrgs] = useState<OrgWithStats[]>([]);
  const [meta, setMeta] = useState<OrgMeta>({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrgListParams>(initial ?? { page: 1, pageSize: 20 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrganisations(filters);
      setOrgs(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(godErr(err, 'Failed to load organisations'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);

  const suspendOrg = async (id: string, reason: string): Promise<void> => {
    await suspendOrganisation(id, reason);
    await refetch();
  };

  const reactivateOrg = async (id: string): Promise<void> => {
    await reactivateOrganisation(id);
    await refetch();
  };

  const deleteOrg = async (id: string, slug: string): Promise<void> => {
    await deleteOrganisation(id, slug);
    await refetch();
  };

  return { orgs, meta, loading, error, filters, setFilters, refetch, suspendOrg, reactivateOrg, deleteOrg };
}
