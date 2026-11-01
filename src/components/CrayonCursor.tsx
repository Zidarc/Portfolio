import { useEffect } from 'react';

/** Each section's crayon (same colours as the navbar). Anything outside a section uses graphite. */
const SECTION_COLOURS: Record<string, string> = {
  home: 'red',
  about: 'blue',
  roles: 'red',
  skills: 'green',
  projects: 'orange',
  draw: 'red',
  contact: 'purple',
};

/** A little crayon, tip at the bottom-left (the cursor's hotspot is 4, 28). */
const crayonSvg = (colour: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
  `<g transform="rotate(-45 16 16)" stroke="#3a3836" stroke-width="1.2" stroke-linejoin="round">` +
  `<path d="M-1 16L5 12.6V19.4Z" fill="${colour}"/>` +
  `<rect x="5" y="12.6" width="28" height="6.8" rx="1" fill="${colour}"/>` +
  `<rect x="11" y="12.6" width="15" height="6.8" fill="#fff" fill-opacity="0.55"/>` +
  `<path d="M14 12.6v6.8M23 12.6v6.8" stroke-width="0.8"/>` +
  `</g></svg>`;

/** A CSS `cursor` value: a crayon in `colour`, with `fallback` for browsers that can't show it. */
export const crayonCursor = (colour: string, fallback = 'auto') =>
  `url("data:image/svg+xml,${encodeURIComponent(crayonSvg(colour))}") 4 28, ${fallback}`;

/**
 * A stick of chalk for the blackboard: no wrapper, a worn blunt tip, a soft highlight and a few dust specks.
 * Tip at the bottom-left, like the crayon (hotspot 5, 27). The faint dark edge keeps it visible over light scenes.
 */
const chalkSvg = (colour: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
  `<g transform="rotate(-45 16 16)">` +
  `<path d="M2.6 12.6H28a3.4 3.4 0 0 1 0 6.8H1.2Q-0.6 16.4 2.6 12.6Z" fill="${colour}" stroke="#0e1512" stroke-opacity="0.55" stroke-width="1"/>` +
  `<path d="M6 14h21" stroke="#fff" stroke-opacity="0.5" stroke-width="1.1" stroke-linecap="round"/>` +
  `<path d="M3.5 18.3h24" stroke="#000" stroke-opacity="0.13" stroke-width="1.4" stroke-linecap="round"/>` +
  `<g fill="#000" fill-opacity="0.16"><circle cx="9" cy="16.3" r="0.6"/><circle cx="15.5" cy="15.4" r="0.5"/>` +
  `<circle cx="21" cy="17" r="0.6"/><circle cx="25.5" cy="15.8" r="0.45"/></g>` +
  `</g></svg>`;

/** The blackboard's `cursor` value: a stick of chalk in `colour`. */
export const chalkCursor = (colour: string, fallback = 'auto') =>
  `url("data:image/svg+xml,${encodeURIComponent(chalkSvg(colour))}") 5 27, ${fallback}`;

/** Crayons by day, chalk on the blackboard at night: the same colours as styles/tokens.css. */
const PALETTES = {
  light: { graphite: '#3a3836', red: '#d6453d', blue: '#3a6fc4', green: '#3f9a4f', orange: '#de6a1e', purple: '#7b52ab' },
  dark: { graphite: '#e8e5da', red: '#f09a8f', blue: '#94b9ef', green: '#9cd7a2', orange: '#f2ad7b', purple: '#c7aeee' },
};

/**
 * Cursor rules. Both themes' crayons are made once, as variables the theme picks between, so switching
 * themes swaps nothing and reads nothing back (reading the live colours forced the whole page's styles
 * to be worked out twice). The cursor is inherited, so each section only needs it once; links and buttons
 * (which default to a hand) are the only elements that need their own rule, and text fields keep the text cursor.
 */
function cursorCss() {
  const own = ':is(a, button, label, summary, [role="button"])';
  const vars = (selector: string, palette: Record<string, string>, cursor: (colour: string) => string) =>
    `${selector} { ${Object.entries(palette)
      .map(([name, colour]) => `--crayon-cursor-${name}: ${cursor(colour)};`)
      .join(' ')} }`;
  const rules = [
    vars('html.crayon-cursor', PALETTES.light, crayonCursor),
    vars("html.crayon-cursor[data-theme='dark']", PALETTES.dark, chalkCursor),
  ];
  rules.push(`html.crayon-cursor body, html.crayon-cursor ${own} { cursor: var(--crayon-cursor-graphite); }`);
  for (const [id, name] of Object.entries(SECTION_COLOURS)) {
    rules.push(`html.crayon-cursor #${id}, html.crayon-cursor #${id} ${own} { cursor: var(--crayon-cursor-${name}); }`);
  }
  rules.push('html.crayon-cursor :is(input, textarea, select) { cursor: text; }');
  return rules.join('\n');
}

/**
 * The mouse pointer becomes a crayon in the colour of the section it's over. Mouse and trackpad only.
 * It's a plain CSS cursor, so it costs nothing: no layer over the page, no work when the mouse moves.
 */
export function CrayonCursor() {
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const root = document.documentElement;
    const style = document.createElement('style');
    style.textContent = cursorCss();
    document.head.append(style);
    root.classList.add('crayon-cursor');
    return () => {
      root.classList.remove('crayon-cursor');
      style.remove();
    };
  }, []);

  return null;
}
