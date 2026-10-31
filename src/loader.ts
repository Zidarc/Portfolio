import { useSyncExternalStore } from 'react';

/*
 * The loading screen is plain HTML in index.html, so it shows before any of this code has arrived.
 * Once the first screen is ready the site calls loaderDone(): the doodles fade out and the element is
 * taken off the page, so it costs nothing after that.
 */

/** Shown at least this long after the page starts loading, so the doodles get a moment. */
const MIN_SHOWN_MS = 900;
const FADE_MS = 400;

let gone = !document.getElementById('loader');
const listeners = new Set<() => void>();

function finish() {
  if (gone) return;
  gone = true;
  listeners.forEach((notify) => notify());
  const el = document.getElementById('loader');
  if (!el) return;
  el.classList.add('is-done');
  window.setTimeout(() => el.remove(), FADE_MS);
}

/** Fade the loading screen out (`immediately`: skip the minimum time, for the test benches). */
export function loaderDone(immediately = false) {
  window.setTimeout(finish, immediately ? 0 : Math.max(0, MIN_SHOWN_MS - performance.now()));
}

/** True once the loading screen has started to go, so an intro can start in front of the visitor. */
export function useLoaderGone(): boolean {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => gone,
    () => true,
  );
}
