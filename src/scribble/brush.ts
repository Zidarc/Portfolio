/**
 * The scribble crayon: strokes, how they're drawn, and where they're kept. Strokes live in
 * sessionStorage, so they last while the tab is open and are gone once the visitor closes it.
 */

/** A stroke's points are [x0, y0, x1, y1, …]: x from the centre of the drawing surface, y from its top. */
export interface Stroke {
  c: string;
  s: number;
  p: number[];
  /** Drawn by the AI (an arrow to an answer), so it's never read back as a question. */
  a?: 1;
}

/** Each crayon, and the chalk it turns into on the blackboard (the same colours as styles/tokens.css). */
export const CRAYONS = [
  { name: 'red', value: '#d6453d', chalk: '#f09a8f' },
  { name: 'orange', value: '#de6a1e', chalk: '#f2ad7b' },
  { name: 'yellow', value: '#e8b931', chalk: '#f1d47c' },
  { name: 'green', value: '#3f9a4f', chalk: '#9cd7a2' },
  { name: 'blue', value: '#3a6fc4', chalk: '#94b9ef' },
  { name: 'purple', value: '#7b52ab', chalk: '#c7aeee' },
  { name: 'pink', value: '#e07aa6', chalk: '#f2acc8' },
  { name: 'brown', value: '#8a5a32', chalk: '#d4ab86' },
  { name: 'graphite', value: '#3a3836', chalk: '#e8e5da' },
] as const;

const CHALK = new Map<string, string>(CRAYONS.map((c) => [c.value, c.chalk]));
/** A stored colour as chalk (for the cursor and the saved image, which can't use CSS variables). */
export const chalkOf = (value: string) => CHALK.get(value) ?? value;

/**
 * How to paint a stored colour: through its crayon's CSS variable, so scribbles turn to chalk on the
 * blackboard (night mode) like everything else. Strokes keep the plain value, which the saved image uses.
 */
const BY_VALUE = new Map<string, string>(CRAYONS.map((c) => [c.value, `var(--crayon-${c.name}, ${c.value})`]));
export const shownColour = (value: string) => BY_VALUE.get(value) ?? value;

export const SIZES = [3, 6, 11, 18] as const;

/** Caps keep a long session from filling up storage or slowing the page. */
const MAX_STROKES = 600;
const MAX_POINTS = 40_000;

/** A smooth path through the points (midpoint quadratic curves, like a real hand). */
export function pathD(p: number[], dx = 0, dy = 0): string {
  if (p.length < 2) return '';
  const x = (i: number) => (p[i]! + dx).toFixed(1);
  const y = (i: number) => (p[i]! + dy).toFixed(1);
  if (p.length === 2) return `M${x(0)} ${y(1)}h0.1`;
  let d = `M${x(0)} ${y(1)}`;
  for (let i = 2; i < p.length - 2; i += 2) {
    const mx = ((p[i]! + p[i + 2]! ) / 2 + dx).toFixed(1);
    const my = ((p[i + 1]! + p[i + 3]!) / 2 + dy).toFixed(1);
    d += `Q${x(i)} ${y(i + 1)} ${mx} ${my}`;
  }
  return `${d}L${x(p.length - 2)} ${y(p.length - 1)}`;
}

export interface Pass {
  d: string;
  width: number;
  opacity: number;
}

/**
 * A crayon line is a few overlapping, slightly offset strokes of different weights; the surface's
 * paper-grain mask (see grainTile) speckles them. Wax on paper without any (slow) texture filters.
 *
 * One line is see-through (about 70% at its heart), so going over the same spot builds the colour
 * up like a highlighter. Layers of one colour can only ever reach that crayon's full colour, never
 * black, and the grain still shows, so even the darkest patch looks like crayon.
 */
export function crayonPasses(stroke: Stroke): Pass[] {
  const { s, p } = stroke;
  return [
    { d: pathD(p), width: s, opacity: 0.35 },
    { d: pathD(p, s * 0.16, -s * 0.12), width: s * 0.6, opacity: 0.3 },
    { d: pathD(p, -s * 0.14, s * 0.1), width: s * 0.4, opacity: 0.35 },
  ];
}

let grain: string | null = null;

/**
 * A tile of paper "tooth" as an image: mostly white with darker specks. Used as a mask over the
 * strokes, it lets the paper show through like wax skipping over the grain. Made once, on demand.
 */
export function grainTile(): string {
  if (grain) return grain;
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const r = Math.random();
    const v = r < 0.12 ? 40 + r * 600 : 200 + Math.random() * 55; // the odd gap, mostly solid wax
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grain = canvas.toDataURL();
  return grain;
}

/** How far the eraser reaches for a given size from the size picker. */
export const eraserRadius = (size: number) => Math.round(size * 1.4 + 6);

/**
 * The same line with points no more than `step` apart, so a cut can land anywhere along it. `own`
 * marks which of them are the line's own points (the rest are in between, on the straight join).
 */
function densify(p: number[], step: number): { p: number[]; own: boolean[] } {
  const out = [p[0]!, p[1]!];
  const own = [true];
  const tenth = (v: number) => Math.round(v * 10) / 10;
  for (let i = 2; i < p.length; i += 2) {
    const x0 = p[i - 2]!;
    const y0 = p[i - 1]!;
    const n = Math.max(1, Math.ceil(Math.hypot(p[i]! - x0, p[i + 1]! - y0) / step));
    for (let k = 1; k <= n; k++) {
      out.push(k === n ? p[i]! : tenth(x0 + ((p[i]! - x0) * k) / n), k === n ? p[i + 1]! : tenth(y0 + ((p[i + 1]! - y0) * k) / n));
      own.push(k === n);
    }
  }
  return { p: out, own };
}

/**
 * Rub out everything within `r` of (x, y), like a real eraser: lines are cut where the eraser crosses
 * them and the pieces either side stay. Returns the same array when nothing was touched.
 */
export function rubOut(strokes: Stroke[], x: number, y: number, r: number): Stroke[] {
  let changed = false;
  const out: Stroke[] = [];
  for (const stroke of strokes) {
    // reach a little further than the eraser so the round line ends don't poke back into the gap
    const reach = r + stroke.s / 2;
    if (!touches(stroke, x, y, r + 40)) {
      out.push(stroke);
      continue;
    }
    // Walk the line in small steps to find where the eraser cuts it, but keep only the line's own points
    // (plus a new end at each cut). Rebuilding the pieces from the small steps made every rubbed line
    // lumpy, and its offset passes stopped lining up, so the lines round the eraser looked thicker.
    const { p, own } = densify(stroke.p, 3);
    let piece: number[] = [];
    /** The last point walked over that wasn't kept, so a piece can end exactly where it was cut. */
    let skipped: [number, number] | null = null;
    let cut = false;
    const finish = () => {
      if (skipped) piece.push(skipped[0], skipped[1]);
      if (piece.length >= 4) out.push({ ...stroke, p: piece });
      piece = [];
      skipped = null;
    };
    for (let i = 0; i < p.length; i += 2) {
      const px = p[i]!;
      const py = p[i + 1]!;
      if ((px - x) ** 2 + (py - y) ** 2 <= reach * reach) {
        cut = true;
        finish();
      } else if (!piece.length || own[i / 2]) {
        // a piece starts at the first point past a cut, then follows the line's own points
        piece.push(px, py);
        skipped = null;
      } else {
        skipped = [px, py];
      }
    }
    if (!cut) {
      out.push(stroke);
      continue;
    }
    changed = true;
    finish();
  }
  return changed ? out : strokes;
}

/** True if (x, y) is within `r` of any point of the stroke (for the eraser). */
export function touches(stroke: Stroke, x: number, y: number, r: number): boolean {
  const reach = r + stroke.s / 2;
  for (let i = 0; i < stroke.p.length; i += 2) {
    const dx = stroke.p[i]! - x;
    const dy = stroke.p[i + 1]! - y;
    if (dx * dx + dy * dy <= reach * reach) return true;
  }
  return false;
}

export function loadStrokes(key: string): Stroke[] {
  try {
    const raw = sessionStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Stroke[]).filter((s) => Array.isArray(s?.p)) : [];
  } catch {
    return [];
  }
}

/** Keep the newest strokes within the caps. */
export function trimStrokes(strokes: Stroke[]): Stroke[] {
  let kept = strokes.slice(-MAX_STROKES);
  let points = kept.reduce((n, s) => n + s.p.length, 0);
  while (points > MAX_POINTS && kept.length > 1) {
    points -= kept[0]!.p.length;
    kept = kept.slice(1);
  }
  return kept;
}

/** Save the strokes for the rest of the session. */
export function saveStrokes(key: string, strokes: Stroke[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(strokes));
  } catch {
    // storage full or blocked: the scribbles still show, they just won't survive a reload
  }
}
