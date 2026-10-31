import { useSyncExternalStore } from 'react';

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

/** The visitor picked a theme: use it, and keep it for next time. */
export function chooseTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // storage blocked: it lasts until they leave
  }
  apply(theme);
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
