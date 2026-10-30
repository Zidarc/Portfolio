import { normals, smoothPath, type Point } from './geometry.ts';
import { createNoise1D, createRng } from './random.ts';
import type { CrayonPlan, PlannedPass } from './strokes.ts';

/** What the worker needs from a plan to build its passes. */
export type PassJob = Pick<CrayonPlan, 'strokes' | 'messiness' | 'pxPerUnit'>;

/** The thinnest edge line is left out where it would be narrower than this on screen (it doesn't show). */
const THIN_EDGE_PX = 1.5;

const round = (n: number) => Math.round(n * 10) / 10;

/** Every stroke's crayon passes, as SVG path data. Pure, so it runs in the worker (or here as a fallback). */
export function buildPasses({ strokes, messiness, pxPerUnit }: PassJob): PlannedPass[][] {
  return strokes.map((stroke) => {
    const base: Point[] = [];
    for (let i = 0; i < stroke.line.length; i += 2) base.push({ x: stroke.line[i]!, y: stroke.line[i + 1]! });
    return crayonPasses(base, stroke.width, messiness, stroke.seed, pxPerUnit).map((p) => ({
      d: smoothPath(p.pts),
      width: round(p.width),
      opacity: p.opacity,
    }));
  });
}

/**
 * A crayon line isn't one clean stroke: the wax skips and smears. We draw a main
 * wobbly line plus two thinner ones riding its edges with their own wobble.
 */
function crayonPasses(base: Point[], W: number, m: number, seed: number, pxPerUnit?: number) {
  const rng = createRng(seed);
  const wobble = createNoise1D(rng);
  const jitter = createNoise1D(rng);
  const edgeA = createNoise1D(rng);
  const edgeB = createNoise1D(rng);
  const n = normals(base);

  let s = 0;
  const arc = base.map((p, i) => {
    if (i > 0) s += Math.hypot(p.x - base[i - 1]!.x, p.y - base[i - 1]!.y);
    return s;
  });

  const along = (offset: (i: number) => number): Point[] =>
    base.map((p, i) => ({ x: p.x + n[i]!.x * offset(i), y: p.y + n[i]!.y * offset(i) }));

  // at most 2.3m units off the centre line; finishPlan pads the drawing by that much
  const centre = (i: number) => (wobble(arc[i]! / 45) * 1.8 + jitter(arc[i]! / 12) * 0.5) * m;

  const passes = [
    { pts: along(centre), width: W, opacity: 0.88 },
    { pts: along((i) => centre(i) + W * 0.24 + edgeA(arc[i]! / 20) * W * 0.15), width: W * 0.55, opacity: 0.55 },
  ];
  if (!pxPerUnit || W * 0.4 * pxPerUnit >= THIN_EDGE_PX) {
    passes.push({ pts: along((i) => centre(i) - W * 0.26 + edgeB(arc[i]! / 18) * W * 0.15), width: W * 0.4, opacity: 0.5 });
  }
  return passes;
}
