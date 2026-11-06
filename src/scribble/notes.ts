import { answerSize } from './answers.ts';
import type { Box } from './camera.ts';

/**
 * Typed text on the sketchpad. A note sits at (x, y), its top-left corner in world units, and is set
 * in the site's handwriting font. Stored like strokes: in sessionStorage, for the life of the tab.
 */
export interface Note {
  id: string;
  x: number;
  y: number;
  /** The text; new lines are line breaks. */
  t: string;
  /** Colour (a crayon's value, like a stroke's). */
  c: string;
  /** Font size in world units. */
  s: number;
  /**
   * An answer written by the AI: the fingerprint of what it answers (see scribble/ai.ts) and the
   * question as the AI read it (sent back with later questions, so follow-ups make sense).
   */
  ai?: { for: string; q?: string };
}

/** Font size for each size in the crayon box's size picker. */
export const NOTE_SIZES: Record<number, number> = { 3: 18, 6: 26, 11: 38, 18: 56 };
export const noteSize = (crayonSize: number) => NOTE_SIZES[crayonSize] ?? 26;

export const NOTE_FONT = "'Patrick Hand', 'Comic Sans MS', 'Segoe Print', cursive";
/** Line height, as a multiple of the font size (the editor uses the same). */
export const LINE = 1.25;

export const newNoteId = () => Math.random().toString(36).slice(2, 10);
export const noteLines = (t: string) => t.split('\n');

let ctx: CanvasRenderingContext2D | null = null;
/** The font's ascent and descent per unit of size, measured once the handwriting font has loaded. */
let ratios: { ascent: number; descent: number } | null = null;
const widths = new Map<string, number>();

function measurer() {
  ctx ??= document.createElement('canvas').getContext('2d');
  const loaded = document.fonts?.check('100px "Patrick Hand"') ?? true;
  if (ctx && loaded && !ratios) {
    ctx.font = `100px ${NOTE_FONT}`;
    const m = ctx.measureText('Hg');
    ratios = { ascent: m.fontBoundingBoxAscent / 100, descent: m.fontBoundingBoxDescent / 100 };
    widths.clear(); // anything measured with the fallback font is out of date
  }
  return ctx;
}

/** Width of one line of a note, in world units. */
function lineWidth(line: string, size: number) {
  const key = `${size}|${line}`;
  let w = widths.get(key);
  if (w === undefined) {
    const c = measurer();
    if (!c) return line.length * size * 0.5;
    c.font = `${size}px ${NOTE_FONT}`;
    w = c.measureText(line).width;
    widths.set(key, w);
  }
  return w;
}

/** Where the first line's baseline sits below the note's top, so typed and shown text line up exactly. */
export function firstBaseline(size: number) {
  measurer();
  const { ascent, descent } = ratios ?? { ascent: 0.9, descent: 0.3 };
  return size * ((LINE - ascent - descent) / 2 + ascent);
}

/** The note's size in world units (an AI answer's comes from its crayon handwriting, see answers.ts). */
export function noteMeasure(n: Pick<Note, 't' | 's'> & Partial<Pick<Note, 'id' | 'ai'>>) {
  if (n.ai && n.id) return answerSize({ id: n.id, t: n.t });
  const lines = noteLines(n.t);
  return { w: Math.max(n.s * 0.5, ...lines.map((l) => lineWidth(l, n.s))), h: lines.length * n.s * LINE };
}

export function noteBox(n: Note): Box {
  const { w, h } = noteMeasure(n);
  return { x0: n.x, y0: n.y, x1: n.x + w, y1: n.y + h };
}

/** The top-most note under the world point (x, y), with a little slack around it. */
export function noteAt(notes: Note[], x: number, y: number, slack = 4): Note | undefined {
  for (let i = notes.length - 1; i >= 0; i--) {
    const b = noteBox(notes[i]!);
    if (x >= b.x0 - slack && x <= b.x1 + slack && y >= b.y0 - slack && y <= b.y1 + slack) return notes[i];
  }
  return undefined;
}

/** True if a circle of radius r at (x, y) touches the note (for the eraser). */
export function noteTouches(n: Note, x: number, y: number, r: number) {
  const b = noteBox(n);
  const dx = Math.max(b.x0 - x, 0, x - b.x1);
  const dy = Math.max(b.y0 - y, 0, y - b.y1);
  return dx * dx + dy * dy <= r * r;
}

export function loadNotes(key: string): Note[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? (parsed as Note[]).filter((n) => typeof n?.t === 'string' && Number.isFinite(n.x)) : [];
  } catch {
    return [];
  }
}

export function saveNotes(key: string, notes: Note[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(notes));
  } catch {
    // storage full or blocked: the notes still show, they just won't survive a reload
  }
}
