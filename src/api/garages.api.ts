import { getPage, get, post, put, del } from './client';
import type { Garage, PaginationParams, PaginatedResponse, CreateGarageBody } from '../types/api.types';
export type { CreateGarageBody };

export const getGarages = (_params?: PaginationParams): Promise<PaginatedResponse<Garage>> =>
  getPage<Garage>('/api/garages', { page: 1, pageSize: 100 });

export const getGarageById = (id: string) => get<Garage>(`/api/garages/${id}`);
export const createGarage = (body: CreateGarageBody) => post<Garage>('/api/garages', body);
export const updateGarage = (id: string, body: Partial<CreateGarageBody>) =>
  put<Garage>(`/api/garages/${id}`, body);
export const deleteGarage = (id: string) => del<void>(`/api/garages/${id}`);
