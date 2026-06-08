import { get } from './client';

export interface SelectOption {
  value: string;
  label: string;
  meta?: Record<string, unknown>;
}

export type SelectEntity =
  | 'drivers' | 'vehicles' | 'load-providers' | 'fuel-stations'
  | 'garages' | 'cities' | 'trips' | 'assignees';

// Strategy 2 + 3: tiny dropdown payloads, fetched ONCE per (entity, params) and
// shared across pages via this in-memory cache (5-min TTL). The server also
// sends Cache-Control: max-age=300, so even a cache miss may be a browser hit.
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; data: SelectOption[] }>();

export async function getSelect(
  entity: SelectEntity,
  params?: Record<string, string | undefined>,
): Promise<SelectOption[]> {
  const key = `${entity}:${JSON.stringify(params ?? {})}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await get<SelectOption[]>(`/api/select/${entity}`, params);
  cache.set(key, { at: Date.now(), data });
  return data;
}

/** Clear the select cache (call after mutations that change dropdown contents). */
export function clearSelectCache(entity?: SelectEntity): void {
  if (!entity) { cache.clear(); return; }
  for (const k of cache.keys()) if (k.startsWith(`${entity}:`)) cache.delete(k);
}
