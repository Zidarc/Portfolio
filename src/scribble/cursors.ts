import { useEffect } from 'react';
import { crayonCursor } from '../components/CrayonCursor.tsx';
import type { Scribbles } from './useScribbles.ts';

/** A pink eraser in a blue sleeve, rubbing end at the bottom-left (the hotspot, 5, 27). */
const ERASER_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
  `<g transform="rotate(-45 16 16)" stroke="#3a3836" stroke-width="1.2" stroke-linejoin="round">` +
  `<rect x="2" y="10" width="13" height="12" rx="2.5" fill="#f4a6c0"/>` +
  `<rect x="14" y="10" width="16" height="12" rx="1.5" fill="#6f9be0"/>` +
  `<path d="M18 13.5h9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>` +
  `</g></svg>`;

const ERASER = `url("data:image/svg+xml,${encodeURIComponent(ERASER_SVG)}") 5 27, cell`;

/** The cursor for whichever tool is picked: a crayon in the picked colour, or the eraser. */
export const toolCursor = (sb: Pick<Scribbles, 'tool' | 'colour'>) =>
  sb.tool === 'eraser' ? ERASER : crayonCursor(sb.colour, 'crosshair');

/** While drawing, the picked tool is the cursor everywhere on the page, toolbar included. */
export function useToolCursor(sb: Scribbles, on: boolean) {
  const { tool, colour } = sb;
  useEffect(() => {
    if (!on) return;
    const style = document.createElement('style');
    const cursor = toolCursor({ tool, colour });
    style.textContent = [
      `html, html * { cursor: ${cursor} !important; }`,
      'html :is(input, textarea, select) { cursor: text !important; }',
    ].join('\n');
    document.head.append(style);
    return () => style.remove();
  }, [on, tool, colour]);
}
