import type { Point } from './geometry.ts';
import { createRng, gauss, range, type Rng } from './random.ts';
import type { CrayonStyle } from './style.ts';
import { finishPlan, handDrawn, type CrayonPlan } from './strokes.ts';

/**
 * Shapes drawn to fit a measured element. Units are CSS pixels (1 unit = 1px),
 * so a box around a wide card isn't stretched and its line stays the same width.
 */
type ShapeFn = (w: number, h: number, rng: Rng, m: number) => Point[][];

/** A slightly bowed line from a to b, the way a hand drifts over a long edge. */
function edge(a: Point, b: Point, rng: Rng, m: number): Point[] {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const bow = gauss(rng) * Math.min(5, len * 0.012) * m;
  const nx = -(b.y - a.y) / (len || 1);
  const ny = (b.x - a.x) / (len || 1);
  const mid = { x: (a.x + b.x) / 2 + nx * bow, y: (a.y + b.y) / 2 + ny * bow };
  return Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * mid.x + t * t * b.x, y: u * u * a.y + 2 * u * t * mid.y + t * t * b.y };
  });
}

const corner = (x: number, y: number, rng: Rng, m: number): Point => ({
  x: x + gauss(rng) * 2.5 * m,
  y: y + gauss(rng) * 2.5 * m,
});

export const SHAPES = {
  /** Four separate edges, clockwise from the top-left, corners crossing or falling short. */
  box: (w, h, rng, m) => {
    const tl = corner(0, 0, rng, m);
    const tr = corner(w, 0, rng, m);
    const br = corner(w, h, rng, m);
    const bl = corner(0, h, rng, m);
    return [edge(tl, tr, rng, m), edge(tr, br, rng, m), edge(br, bl, rng, m), edge(bl, tl, rng, m)];
  },
  /** One line down the middle of the element. */
  vline: (w, h, rng, m) => [edge({ x: w / 2, y: 0 }, { x: w / 2, y: h }, rng, m)],
} satisfies Record<string, ShapeFn>;

export type ShapeName = keyof typeof SHAPES;

export interface ShapeOptions extends CrayonStyle {
  seed: number;
}

export function planShape(name: ShapeName, w: number, h: number, opts: ShapeOptions): CrayonPlan {
  const m = opts.messiness;
  const rng = createRng(opts.seed);
  const raw = SHAPES[name](w, h, rng, m).map((pts, i) => ({
    pts: handDrawn(pts, m, rng),
    pause: i === 0 ? 0 : range(rng, 40, 110),
  }));
  // room around the element for overshoot and the line's own width
  const pad = opts.weight * 100 * 2 + 10;
  return finishPlan(raw, m, opts.speed, opts.weight, rng, { x: -pad, y: -pad, w: w + pad * 2, h: h + pad * 2 });
}

/** Padding (px) planShape leaves around the element; the overlay is offset by this much. */
export const shapePad = (weight: number) => weight * 100 * 2 + 10;
