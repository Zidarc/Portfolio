import { useCallback, useSyncExternalStore } from 'react';

/** One MediaQueryList per query, shared: matchMedia on every render was measurable work while scrolling. */
const lists = new Map<string, MediaQueryList>();
const listFor = (query: string) => {
  let mql = lists.get(query);
  if (!mql) lists.set(query, (mql = window.matchMedia(query)));
  return mql;
};

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = listFor(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => listFor(query).matches, () => false);
}
