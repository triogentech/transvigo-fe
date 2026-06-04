import type { ImpersonationMeta } from '../types/god.types';

// Impersonation tokens live in sessionStorage ONLY (cleared on tab close).
const TOKEN_KEY = 'god_impersonation_token';
const META_KEY = 'god_impersonation_meta';

export function getImpersonationToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}
export function getImpersonationMeta(): ImpersonationMeta | null {
  const raw = sessionStorage.getItem(META_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as ImpersonationMeta; } catch { return null; }
}
export function setImpersonation(token: string, meta: ImpersonationMeta): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(META_KEY, JSON.stringify(meta));
}
export function clearImpersonation(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(META_KEY);
}
