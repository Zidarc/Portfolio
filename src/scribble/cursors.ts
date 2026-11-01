import { useEffect } from 'react';
import { chalkCursor, crayonCursor } from '../components/CrayonCursor.tsx';
import { useTheme, type Theme } from '../theme.ts';
import { chalkOf } from './brush.ts';
import type { Scribbles } from './useScribbles.ts';

/** A pink eraser in a blue sleeve, rubbing end at the bottom-left (the hotspot, 5, 27). */
const ERASER_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
  `<g transform="rotate(-45 16 16)" stroke="#3a3836" stroke-width="1.2" stroke-linejoin="round">` +
  `<rect x="2" y="10" width="13" height="12" rx="2.5" fill="#f4a6c0"/>` +
  `<rect x="14" y="10" width="16" height="12" rx="1.5" fill="#6f9be0"/>` +
  `<path d="M18 13.5h9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>` +
  `</g></svg>`;

/** The blackboard's duster: a grey felt pad on a wooden block, felt at the bottom-left (the hotspot, 5, 27). */
const DUSTER_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
  `<g transform="rotate(-45 16 16)" stroke="#0e1512" stroke-opacity="0.6" stroke-width="1.1" stroke-linejoin="round">` +
  `<rect x="2" y="10" width="8" height="12" rx="2" fill="#a9ada6"/>` +
  `<path d="M4.5 12.5v7M7.5 12.5v7" stroke="#fff" stroke-opacity="0.35" stroke-width="0.9"/>` +
  `<rect x="9" y="9" width="21" height="14" rx="2.5" fill="#c99a68"/>` +
  `<path d="M13 13c4 1 9-1 14 0M13 18c5-1 9 1 14 0" fill="none" stroke="#8a5a32" stroke-opacity="0.6" stroke-width="0.8"/>` +
  `</g></svg>`;

const ERASER = `url("data:image/svg+xml,${encodeURIComponent(ERASER_SVG)}") 5 27, cell`;
const DUSTER = `url("data:image/svg+xml,${encodeURIComponent(DUSTER_SVG)}") 5 27, cell`;

/** The cursor for whichever tool is picked: a crayon (chalk at night) in the picked colour, the eraser (duster), or a text cursor for typing. */
export const toolCursor = (sb: Pick<Scribbles, 'tool' | 'colour'>, theme: Theme) => {
  const night = theme === 'dark';
  if (sb.tool === 'text') return 'text';
  if (sb.tool === 'eraser') return night ? DUSTER : ERASER;
  return night ? chalkCursor(chalkOf(sb.colour), 'crosshair') : crayonCursor(sb.colour, 'crosshair');
};

/** While drawing, the picked tool is the cursor everywhere on the page, toolbar included. */
export function useToolCursor(sb: Scribbles, on: boolean) {
  const { tool, colour } = sb;
  const theme = useTheme();
  useEffect(() => {
    if (!on) return;
    const style = document.createElement('style');
    const cursor = toolCursor({ tool, colour }, theme);
    style.textContent = [
      `html, html * { cursor: ${cursor} !important; }`,
      'html :is(input, textarea, select) { cursor: text !important; }',
    ].join('\n');
    document.head.append(style);
    return () => style.remove();
  }, [on, tool, colour, theme]);
}
