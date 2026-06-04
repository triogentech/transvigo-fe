import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Syncs filter state with URL search params. Numeric strings are coerced to
 * numbers so callers receive the same types as their defaults.
 *
 * `setFilters` merges a partial update, removes keys whose value is
 * undefined / null / '', and updates the URL with `{ replace: true }` (no
 * browser-history entry per keystroke).
 */
export function useUrlFilters<T extends Record<string, unknown>>(
  defaults: T,
): { filters: T; setFilters: (updates: Partial<T>) => void } {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<T>(() => {
    const result = { ...defaults } as Record<string, unknown>;
    for (const [key, raw] of searchParams.entries()) {
      if (key in defaults) {
        const defaultVal = defaults[key];
        if (typeof defaultVal === 'number') {
          const n = Number(raw);
          result[key] = Number.isFinite(n) ? n : defaultVal;
        } else {
          result[key] = raw;
        }
      } else {
        // Accept extra keys not present in defaults — coerce numeric strings.
        const n = Number(raw);
        result[key] = raw !== '' && Number.isFinite(n) ? n : raw;
      }
    }
    return result as T;
  }, [searchParams, defaults]);

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(updates)) {
            if (v === undefined || v === null || v === '') {
              next.delete(k);
            } else {
              next.set(k, String(v));
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { filters, setFilters };
}
