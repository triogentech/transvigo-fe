import { getPage, post, put } from './client';
import type {
  Tyre,
  CreateTyreBody,
  CreateTyreMovementBody,
  PaginatedResponse,
} from '../types/api.types';

export type { CreateTyreBody, CreateTyreMovementBody };

export const getTyres = (): Promise<PaginatedResponse<Tyre>> =>
  getPage<Tyre>('/api/tyres', { page: 1, pageSize: 100 });

export const createTyre = (body: CreateTyreBody) => post<Tyre>('/api/tyres', body);

export const updateTyre = (id: string, body: Partial<CreateTyreBody>) =>
  put<Tyre>(`/api/tyres/${id}`, body);

export const addMovement = (id: string, body: CreateTyreMovementBody) =>
  post<Tyre>(`/api/tyres/${id}/movement`, body);
