import { getPage, get, post, put, del } from './client';
import type { LoadProvider, PaginationParams, PaginatedResponse, CreateLoadProviderBody } from '../types/api.types';
export type { CreateLoadProviderBody };

export type LoadProviderParams = PaginationParams & {
  cityId?: string;
  isActive?: boolean;
};

export const getLoadProviders = (_params?: LoadProviderParams): Promise<PaginatedResponse<LoadProvider>> =>
  getPage<LoadProvider>('/api/load-providers', { page: 1, pageSize: 100 });

export const getLoadProviderById = (id: string) => get<LoadProvider>(`/api/load-providers/${id}`);
export const createLoadProvider = (body: CreateLoadProviderBody) => post<LoadProvider>('/api/load-providers', body);
export const updateLoadProvider = (id: string, body: Partial<CreateLoadProviderBody>) =>
  put<LoadProvider>(`/api/load-providers/${id}`, body);
export const deleteLoadProvider = (id: string) => del<void>(`/api/load-providers/${id}`);
