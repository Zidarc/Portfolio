import { useEffect } from 'react';

/** Each section's crayon (same colours as the navbar). Anything outside a section uses graphite. */
const SECTION_COLOURS: Record<string, string> = {
  home: 'red',
  about: 'blue',
  roles: 'red',
  skills: 'green',
  projects: 'orange',
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
 * Cursor rules, built from the live colour tokens so the crayon matches the page. The cursor is
 * inherited, so each section only needs it once; links and buttons (which default to a hand) are
 * the only elements that need their own rule, and text fields keep the text cursor.
 */
function cursorCss(colours: Record<string, string>) {
  const own = ':is(a, button, label, summary, [role="button"])';
  const rules = [`html.crayon-cursor body, html.crayon-cursor ${own} { cursor: ${crayonCursor(colours.graphite!)}; }`];
  for (const [id, name] of Object.entries(SECTION_COLOURS)) {
    rules.push(`html.crayon-cursor #${id}, html.crayon-cursor #${id} ${own} { cursor: ${crayonCursor(colours[name]!)}; }`);
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
    const tokens = getComputedStyle(root);
    const colours: Record<string, string> = {};
    for (const name of ['graphite', 'red', 'blue', 'green', 'orange', 'purple']) {
      colours[name] = tokens.getPropertyValue(`--crayon-${name}`).trim() || '#3a3836';
    }

    const style = document.createElement('style');
    style.textContent = cursorCss(colours);
    document.head.append(style);
    root.classList.add('crayon-cursor');
    return () => {
      root.classList.remove('crayon-cursor');
      style.remove();
    };
  }, []);

  return null;
}
