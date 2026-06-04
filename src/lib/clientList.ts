import type { PaginatedResponse } from '../types/api.types';

/**
 * Client-side filter + paginate over an already-fetched array. transvigo-be
 * has no server-side filtering (list routes accept only page/pageSize), so the
 * hooks fetch up to `pageSize: 100` and narrow/paginate here. Returns the
 * standard PaginatedResponse shape so pages treat it identically to a server
 * page. (Adequate at the current data scale; revisit if a tenant exceeds ~100
 * rows of any entity — then add real server filters.)
 */
export function clientPage<T>(
  rows: T[],
  predicate: ((row: T) => boolean) | undefined,
  page = 1,
  pageSize = 10,
): PaginatedResponse<T> {
  const filtered = predicate ? rows.filter(predicate) : rows;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    data: filtered.slice(start, start + pageSize),
    meta: { total, page: safePage, pageSize, totalPages },
  };
}

/** Case-insensitive substring match across the given fields. */
export function matchesSearch<T>(row: T, fields: Array<keyof T>, q?: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return fields.some((f) => String(row[f] ?? '').toLowerCase().includes(needle));
}
