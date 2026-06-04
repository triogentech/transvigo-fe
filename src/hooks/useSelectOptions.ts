import { useCallback, useEffect, useState } from 'react';
import { getSelect, clearSelectCache, type SelectEntity, type SelectOption } from '../api/select.api';

/**
 * Fetches select/dropdown options for a given entity. The underlying
 * `getSelect` call is already cached (5-min TTL), so multiple components
 * using the same entity/params share one network request.
 *
 * `invalidate` clears the in-memory cache for the entity and re-fetches.
 */
export function useSelectOptions(
  entity: SelectEntity,
  params?: Record<string, string | undefined>,
): { options: SelectOption[]; loading: boolean; invalidate: () => void } {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setOptions(await getSelect(entity, params));
    } finally {
      setLoading(false);
    }
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [entity, JSON.stringify(params)]);

  useEffect(() => { void fetch(); }, [fetch]);

  const invalidate = useCallback(() => {
    clearSelectCache(entity);
    void fetch();
  }, [entity, fetch]);

  return { options, loading, invalidate };
}
