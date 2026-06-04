import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { config } from '../config';
import type { PaginatedResponse, TokenPair } from '../types/api.types';

const client = axios.create({
  baseURL: config.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Event bus (decouples the non-React client from React toast/auth state) ──
export type ToastKind = 'success' | 'error' | 'warning' | 'info';
export function emitToast(kind: ToastKind, message: string): void {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { kind, message } }));
}
function dispatchLogout(): void {
  localStorage.removeItem(config.tokenKeys.access);
  localStorage.removeItem(config.tokenKeys.refresh);
  localStorage.removeItem(config.tokenKeys.orgSlug);
  window.dispatchEvent(new Event('auth:logout'));
}

// ── Request interceptor ──
client.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  // God Mode impersonation: when an impersonation token is present in
  // sessionStorage, all tenant calls run AS the impersonated user.
  const impersonationToken = sessionStorage.getItem('god_impersonation_token');
  if (impersonationToken) {
    req.headers.Authorization = `Bearer ${impersonationToken}`;
    req.headers['X-Impersonation'] = 'true';
    return req;
  }
  const token = localStorage.getItem(config.tokenKeys.access);
  if (token) req.headers.Authorization = `Bearer ${token}`;
  const orgSlug = localStorage.getItem(config.tokenKeys.orgSlug);
  if (orgSlug) req.headers['X-Org-Slug'] = orgSlug; // ignored by backend; harmless
  return req;
});

// ── Single-flight token refresh ──
let refreshPromise: Promise<TokenPair> | null = null;
async function refreshTokens(): Promise<TokenPair> {
  const refreshToken = localStorage.getItem(config.tokenKeys.refresh);
  if (!refreshToken) throw new Error('No refresh token');
  // Bare axios call to avoid interceptor recursion.
  const { data } = await axios.post<TokenPair>(
    `${config.apiUrl}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  localStorage.setItem(config.tokenKeys.access, data.accessToken);
  localStorage.setItem(config.tokenKeys.refresh, data.refreshToken);
  return data;
}

// ── Response interceptor ──
client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ error?: string; code?: string }>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Network error (no response)
    if (!error.response) {
      emitToast('error', 'Network error — check your connection');
      return Promise.reject(error);
    }

    const status = error.response.status;

    // During impersonation there is no refresh — a 401 means the session ended
    // server-side. Clear it and let the user return to God Mode.
    if (status === 401 && sessionStorage.getItem('god_impersonation_token')) {
      sessionStorage.removeItem('god_impersonation_token');
      sessionStorage.removeItem('god_impersonation_meta');
      emitToast('warning', 'Impersonation session ended');
      window.dispatchEvent(new Event('impersonation:ended'));
      return Promise.reject(error);
    }

    // 401 → attempt transparent refresh, then retry once
    if (status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        if (!localStorage.getItem(config.tokenKeys.refresh)) {
          dispatchLogout();
          return Promise.reject(error);
        }
        refreshPromise = refreshPromise ?? refreshTokens();
        const { accessToken } = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return client(original);
      } catch (refreshErr) {
        refreshPromise = null;
        dispatchLogout();
        return Promise.reject(refreshErr);
      }
    }

    // 403 → mustChangePwd is special; otherwise a permission denial toast
    if (status === 403) {
      if (error.response.data?.code === 'MUST_CHANGE_PASSWORD') {
        window.dispatchEvent(new Event('auth:mustChangePwd'));
      } else {
        emitToast('error', "You don't have permission to perform this action");
      }
      return Promise.reject(error);
    }

    if (status >= 500) emitToast('error', 'Server error — please try again');

    return Promise.reject(error);
  },
);

// ── Typed helpers ──
export const get = <T>(url: string, params?: object) =>
  client.get<T>(url, { params }).then((r) => r.data);
export const post = <T>(url: string, data?: object, cfg?: AxiosRequestConfig) =>
  client.post<T>(url, data, cfg).then((r) => r.data);
export const put = <T>(url: string, data?: object) =>
  client.put<T>(url, data).then((r) => r.data);
export const patch = <T>(url: string, data?: object) =>
  client.patch<T>(url, data).then((r) => r.data);
export const del = <T>(url: string) => client.delete<T>(url).then((r) => r.data);

/** Backend list-response shape: { data, pagination: {...} }. */
interface BackendPage<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; pageCount: number };
}

/**
 * Fetches a list endpoint and normalises the backend's `pagination` envelope
 * into the frontend `meta` shape. Only `page`/`pageSize` are honoured
 * server-side — other params are accepted but ignored by transvigo-be (we
 * filter client-side in the hooks).
 */
export async function getPage<T>(url: string, params?: object): Promise<PaginatedResponse<T>> {
  const raw = await get<BackendPage<T>>(url, params);
  return {
    data: raw.data,
    meta: {
      total: raw.pagination.total,
      page: raw.pagination.page,
      pageSize: raw.pagination.pageSize,
      totalPages: raw.pagination.pageCount,
    },
  };
}

/** Extracts a human message from an Axios error for toast.error(...). */
export function errMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return data?.error ?? data?.message ?? err.message ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export default client;
