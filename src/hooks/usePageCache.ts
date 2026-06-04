import { useEffect } from 'react';

/** Broadcast that all cached data for the given API path is stale. */
export function invalidatePageCache(path: string): void {
  window.dispatchEvent(new CustomEvent('page-cache-invalidated', { detail: { path } }));
}

/**
 * Subscribe to page-cache invalidation events. When an event fires whose
 * `detail.path` matches `path`, `refetch` is called. Listener is cleaned up
 * on unmount.
 */
export function usePageCacheListener(path: string, refetch: () => void): void {
  useEffect(() => {
    function handler(e: Event): void {
      const detail = (e as CustomEvent<{ path: string }>).detail;
      if (detail.path === path) refetch();
    }
    window.addEventListener('page-cache-invalidated', handler);
    return () => { window.removeEventListener('page-cache-invalidated', handler); };
  }, [path, refetch]);
}
