import { getPage, get, post, put } from './client';
import type {
  JobCard,
  JobCardStatus,
  CreateJobCardBody,
  PaginatedResponse,
} from '../types/api.types';

export type { CreateJobCardBody };

export const getJobCards = (): Promise<PaginatedResponse<JobCard>> =>
  getPage<JobCard>('/api/job-cards', { page: 1, pageSize: 100 });

export const getJobCardById = (id: string) => get<JobCard>(`/api/job-cards/${id}`);

export const createJobCard = (body: CreateJobCardBody) =>
  post<JobCard>('/api/job-cards', body);

export const updateJobCard = (id: string, body: Record<string, unknown>) =>
  put<JobCard>(`/api/job-cards/${id}`, body);

export const changeJobCardStatus = (id: string, status: JobCardStatus) =>
  put<JobCard>(`/api/job-cards/${id}/status`, { status });
