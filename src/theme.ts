import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

/*
 * Paper (light) or blackboard (dark). The script at the top of index.html picks the theme before the first
 * paint, so there's no flash: the visitor's own choice if they've made one, else the system's dark setting.
 * Switching only flips <html data-theme>; the colours are all CSS variables (styles/tokens.css).
 */

export type Theme = 'light' | 'dark';

const KEY = 'theme';
/** The browser bar colour for each theme (the paper and the board). */
const BAR: Record<Theme, string> = { light: '#fbf7ee', dark: '#1f2b26' };

const listeners = new Set<() => void>();
const current = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

function apply(theme: Theme) {
  if (theme === current()) return;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[theme]);
  listeners.forEach((notify) => notify());
}

const chosen = (): Theme | null => {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'dark' || saved === 'light' ? saved : null;
  } catch {
    return null; // storage blocked: just follow the system
  }
};

/** How long the new theme takes to spread across the screen. */
const WIPE_MS = 650;

/**
 * The visitor picked a theme: use it, and keep it for next time. Given the point they clicked, the new
 * theme spreads out from it in a circle. That's a view transition: the browser swaps the page once and
 * animates two still snapshots on the GPU, so the wipe itself costs nothing. Browsers without view
 * transitions, and visitors who prefer less motion, get the plain instant switch.
 */
export function chooseTheme(theme: Theme, from?: { x: number; y: number }) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // storage blocked: it lasts until they leave
  }
  const root = document.documentElement;
  if (!from || !document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    apply(theme);
    return;
  }
  root.classList.add('theme-wipe'); // so the page-turn between pages (global.css) leaves this one alone
  const wipe = document.startViewTransition(() => flushSync(() => apply(theme)));
  const { x, y } = from;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  void wipe.ready.then(() =>
    root.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: WIPE_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
    ),
  );
  void wipe.finished.finally(() => root.classList.remove('theme-wipe'));
}

// until they pick one, follow the system as it changes (e.g. the phone going dark at sunset)
const system = window.matchMedia('(prefers-color-scheme: dark)');
system.addEventListener('change', (e) => {
  if (!chosen()) apply(e.matches ? 'dark' : 'light');
});

export function useTheme(): Theme {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    current,
    () => 'light',
  );
}
