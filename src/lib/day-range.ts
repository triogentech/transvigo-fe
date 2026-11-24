/**
 * A day filter is picked as "2026-11-23" but means that day on the user's own clock: 00:00 to 23:59:59.999 where
 * they are, not in UTC (a 3 AM trip in India is still the day before in UTC). Turns the picked days of a filter
 * into those exact moments for the API.
 */
const startOfDay = (d: string) => new Date(`${d}T00:00:00`).toISOString();
const endOfDay = (d: string) => new Date(`${d}T23:59:59.999`).toISOString();

const DAY_PARAMS: Array<[from: string, to: string]> = [
  ['startFrom', 'startTo'], ['endFrom', 'endTo'], ['dateFrom', 'dateTo'],
  ['tripStartFrom', 'tripStartTo'], ['tripCloseFrom', 'tripCloseTo'],
];

export function withDayBounds<T extends object>(params: T): T {
  const out = { ...params } as Record<string, unknown>;
  for (const [from, to] of DAY_PARAMS) {
    if (typeof out[from] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(out[from] as string)) out[from] = startOfDay(out[from] as string);
    if (typeof out[to] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(out[to] as string)) out[to] = endOfDay(out[to] as string);
  }
  return out as T;
}
