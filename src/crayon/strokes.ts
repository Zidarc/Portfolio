import { createNoise1D, gauss, range, type Rng } from './random.ts';
import { extendEnds, normals, polylineLength, resample, smoothPath, type Point } from './geometry.ts';

/** Internal unit: a letter's cap height (and 1/100 of a doodle's design box). */
export const CAP = 100;

/** A pen-down → pen-up movement before it's turned into crayon. */
export interface RawStroke {
  pts: Point[];
  /** Pause before this stroke starts, in ms at speed 1. */
  pause: number;
  /** Overrides the drawing colour for this stroke (a kid switching crayons). */
  colour?: string;
}

export interface PlannedPass {
  d: string;
  width: number;
  opacity: number;
}

export interface PlannedStroke {
  passes: PlannedPass[];
  /** ms from the start of drawing. */
  delay: number;
  duration: number;
  colour?: string;
}

export interface CrayonPlan {
  strokes: PlannedStroke[];
  viewBox: string;
  width: number;
  height: number;
  totalDuration: number;
  /** Main line width in viewBox units (the texture filter adapts to it). */
  lineWidth: number;
}

/** Makes a clean stroke hand-made: shifted a bit, started/ended early or late, densely resampled for wobble. */
export function handDrawn(pts: Point[], m: number, rng: Rng): Point[] {
  const offX = gauss(rng) * 0.022 * m * CAP;
  const offY = gauss(rng) * 0.022 * m * CAP;
  const shifted = pts.map((p) => ({ x: p.x + offX, y: p.y + offY }));
  return resample(extendEnds(shifted, range(rng, -0.02, 0.05) * m * CAP, range(rng, -0.03, 0.07) * m * CAP), 4);
}

/** A fixed viewBox, for drawings that must line up with something else (e.g. rings around a photo). */
export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Turns hand-made centre lines into layered crayon passes with timing. */
export function finishPlan(raw: RawStroke[], m: number, speed: number, weight: number, rng: Rng, frame?: Frame): CrayonPlan {
  const W = weight * CAP;
  // crayon moves ~1.2 cap heights per 100ms at speed 1
  const penSpeed = 1.2 * speed;
  let t = 0;
  const allPts: Point[] = [];

  const strokes = raw.map((s): PlannedStroke => {
    const passes = crayonPasses(s.pts, W * (1 + gauss(rng) * 0.08), m, rng);
    for (const p of passes) allPts.push(...p.pts);
    t += s.pause / speed;
    const duration = Math.max(70, (polylineLength(s.pts) / penSpeed) * (1 + gauss(rng) * 0.12));
    const planned = {
      delay: t,
      duration,
      colour: s.colour,
      passes: passes.map((p) => ({ d: smoothPath(p.pts), width: round(p.width), opacity: p.opacity })),
    };
    t += duration;
    return planned;
  });

  const b = bounds(allPts);
  const pad = W * 1.5;
  const vb = frame ?? { x: b.minX - pad, y: b.minY - pad, w: b.maxX - b.minX + pad * 2, h: b.maxY - b.minY + pad * 2 };
  return {
    strokes,
    viewBox: [vb.x, vb.y, vb.w, vb.h].map(round).join(' '),
    width: vb.w,
    height: vb.h,
    totalDuration: t,
    lineWidth: W,
  };
}

/**
 * A crayon line isn't one clean stroke: the wax skips and smears. We draw a main
 * wobbly line plus two thinner ones riding its edges with their own wobble.
 */
function crayonPasses(base: Point[], W: number, m: number, rng: Rng) {
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

  const centre = (i: number) => (wobble(arc[i]! / 45) * 1.8 + jitter(arc[i]! / 12) * 0.5) * m;

  return [
    { pts: along(centre), width: W, opacity: 0.88 },
    { pts: along((i) => centre(i) + W * 0.24 + edgeA(arc[i]! / 20) * W * 0.15), width: W * 0.55, opacity: 0.55 },
    { pts: along((i) => centre(i) - W * 0.26 + edgeB(arc[i]! / 18) * W * 0.15), width: W * 0.4, opacity: 0.5 },
  ];
}

export function bounds(pts: Point[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return pts.length ? { minX, minY, maxX, maxY } : { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

const round = (n: number) => Math.round(n * 10) / 10;
