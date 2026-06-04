import { getPage, get, post, put, del } from './client';
import type { City, PaginationParams, PaginatedResponse, CreateCityBody } from '../types/api.types';
export type { CreateCityBody };

export const getCities = (_params?: PaginationParams): Promise<PaginatedResponse<City>> =>
  getPage<City>('/api/cities', { page: 1, pageSize: 100 });

export const getCityById = (id: string) => get<City>(`/api/cities/${id}`);
export const createCity = (body: CreateCityBody) => post<City>('/api/cities', body);
export const updateCity = (id: string, body: Partial<CreateCityBody>) =>
  put<City>(`/api/cities/${id}`, body);
export const deleteCity = (id: string) => del<void>(`/api/cities/${id}`);
