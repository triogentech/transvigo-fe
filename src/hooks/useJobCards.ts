import { useCallback, useEffect, useState } from 'react';
import * as jobCardsApi from '../api/job-cards.api';
import { errMessage } from '../api/client';
import type { CreateJobCardBody, JobCard, JobCardStatus } from '../types/api.types';

export function useJobCards() {
  const [all, setAll] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await jobCardsApi.getJobCards();
      setAll(res.data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load job cards'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createJobCard = async (body: CreateJobCardBody) => {
    const jc = await jobCardsApi.createJobCard(body);
    await refetch();
    return jc;
  };

  const changeStatus = async (id: string, status: JobCardStatus) => {
    const jc = await jobCardsApi.changeJobCardStatus(id, status);
    await refetch();
    return jc;
  };

  return { allJobCards: all, loading, error, refetch, createJobCard, changeStatus };
}
