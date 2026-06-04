import { useCallback, useEffect, useState } from 'react';
import {
  getOnboardingRequests,
  approveRequest,
  rejectRequest,
  type OnboardingListParams,
} from '../../api/god/onboarding.api';
import { godErr } from '../../api/god/client';
import type { OnboardingRequest, CreateOrgBody } from '../../types/god.types';
import type { PaginatedResponse } from '../../types/api.types';

type OnboardingMeta = PaginatedResponse<OnboardingRequest>['meta'];

export function useOnboardingRequests(initial?: OnboardingListParams) {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [meta, setMeta] = useState<OnboardingMeta>({ total: 0, page: 1, pageSize: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OnboardingListParams>(initial ?? { page: 1, pageSize: 20 });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOnboardingRequests(filters);
      setRequests(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(godErr(err, 'Failed to load onboarding requests'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void refetch(); }, [refetch]);

  const approve = async (id: string, body: CreateOrgBody): Promise<void> => {
    await approveRequest(id, body);
    await refetch();
  };

  const reject = async (id: string, reason: string): Promise<void> => {
    await rejectRequest(id, reason);
    await refetch();
  };

  return { requests, meta, loading, error, filters, setFilters, refetch, approve, reject };
}
