import { post } from './client';
import type { LoginRequest, LoginResponse, TokenPair } from '../types/api.types';

export const login = (body: LoginRequest) => post<LoginResponse>('/auth/login', body);

export const refresh = (refreshToken: string) =>
  post<TokenPair>('/auth/refresh', { refreshToken });

export const logout = () => post<{ message: string }>('/auth/logout');

export const changePassword = (body: { currentPassword: string; newPassword: string }) =>
  post<{ message: string }>('/auth/change-password', body);

export const forgotPassword = (body: { email: string; orgSlug: string }) =>
  post<{ message: string }>('/auth/forgot-password', body);

export const resetPassword = (body: { token: string; newPassword: string }) =>
  post<{ message: string }>('/auth/reset-password', body);
