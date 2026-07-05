import { useEffect, useState } from 'react';

/**
 * A `useState` that persists to `localStorage` under `key`. Reads the stored
 * value on first mount (falling back to `initial`) and writes on every change.
 * All storage access is guarded so a disabled/full storage never throws.
 *
 * Use for lightweight per-user UI preferences (chosen view, active filter, …)
 * that should survive a reload but don't need to sync across devices.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage unavailable / over quota — preference just won't persist */
    }
  }, [key, state]);

  return [state, setState];
}
