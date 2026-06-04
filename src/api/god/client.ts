import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { config } from '../../config';
import type { PaginatedResponse } from '../../types/api.types';

// God Mode API client. Same server, separate token keys (god_*), separate
// refresh endpoint, NO X-Org-Slug header. On unrecoverable 401 it dispatches
// 'platform:logout' (handled by PlatformAuthContext).
export const GOD_KEYS = {
  access: 'god_access_token',
  refresh: 'god_refresh_token',
} as const;

const god = axios.create({
  baseURL: config.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

function emitToast(kind: 'success' | 'error' | 'warning' | 'info', message: string): void {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { kind, message } }));
}
function dispatchPlatformLogout(): void {
  localStorage.removeItem(GOD_KEYS.access);
  localStorage.removeItem(GOD_KEYS.refresh);
  window.dispatchEvent(new Event('platform:logout'));
}

god.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(GOD_KEYS.access);
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;
async function refreshTokens() {
  const refreshToken = localStorage.getItem(GOD_KEYS.refresh);
  if (!refreshToken) throw new Error('No platform refresh token');
  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${config.apiUrl}/platform/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  localStorage.setItem(GOD_KEYS.access, data.accessToken);
  localStorage.setItem(GOD_KEYS.refresh, data.refreshToken);
  return data;
}

god.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ error?: string }>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!error.response) {
      emitToast('error', 'Network error — check your connection');
      return Promise.reject(error);
    }
    const status = error.response.status;
    if (status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        if (!localStorage.getItem(GOD_KEYS.refresh)) { dispatchPlatformLogout(); return Promise.reject(error); }
        refreshPromise = refreshPromise ?? refreshTokens();
        const { accessToken } = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return god(original);
      } catch (e) {
        refreshPromise = null;
        dispatchPlatformLogout();
        return Promise.reject(e);
      }
    }
    if (status === 403) emitToast('error', "You don't have permission for this platform action");
    if (status >= 500) emitToast('error', 'Server error — please try again');
    return Promise.reject(error);
  },
);

export const gGet = <T>(url: string, params?: object) => god.get<T>(url, { params }).then((r) => r.data);
export const gPost = <T>(url: string, data?: object, cfg?: AxiosRequestConfig) => god.post<T>(url, data, cfg).then((r) => r.data);
export const gPatch = <T>(url: string, data?: object) => god.patch<T>(url, data).then((r) => r.data);
export const gDel = <T>(url: string, data?: object) => god.delete<T>(url, { data }).then((r) => r.data);

interface BackendPage<T> { data: T[]; pagination: { page: number; pageSize: number; total: number; pageCount: number } }
export async function gGetPage<T>(url: string, params?: object): Promise<PaginatedResponse<T>> {
  const raw = await gGet<BackendPage<T>>(url, params);
  return {
    data: raw.data,
    meta: { total: raw.pagination.total, page: raw.pagination.page, pageSize: raw.pagination.pageSize, totalPages: raw.pagination.pageCount },
  };
}

export function godErr(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { error?: string; message?: string } | undefined;
    return d?.error ?? d?.message ?? err.message ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export default god;
