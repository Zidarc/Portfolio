import { gauss, range, type Rng } from './random.ts';
import { extendEnds, polylineLength, resample, type Point } from './geometry.ts';

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
  /**
   * Centre line as flat x, y pairs; its crayon passes are built from it off the main thread (see passes.ts).
   * A typed array, because sending it to the worker is then a plain copy instead of a slow clone.
   */
  line: Float32Array;
  /** Width of the main pass. */
  width: number;
  /** Seeds the wobble of the passes. */
  seed: number;
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
  messiness: number;
  /** Exact on-screen px per unit, if known: edge lines too thin to see are then left out. */
  pxPerUnit?: number;
}

/**
 * How far apart (in units) to put the points that carry the wobble: about one per 3 screen px, never closer
 * than 4 units. Small drawings don't need more; every point is path data to build, parse, lay out and paint.
 */
export const pointSpacing = (pxPerUnit = 1) => Math.min(12, Math.max(4, 3 / pxPerUnit));

/** Makes a clean stroke hand-made: shifted a bit, started/ended early or late, resampled for wobble. */
export function handDrawn(pts: Point[], m: number, rng: Rng, spacing = 4): Point[] {
  const offX = gauss(rng) * 0.022 * m * CAP;
  const offY = gauss(rng) * 0.022 * m * CAP;
  const shifted = pts.map((p) => ({ x: p.x + offX, y: p.y + offY }));
  return resample(extendEnds(shifted, range(rng, -0.02, 0.05) * m * CAP, range(rng, -0.03, 0.07) * m * CAP), spacing);
}

/** A fixed viewBox, for drawings that must line up with something else (e.g. rings around a photo). */
export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Lays out hand-made centre lines with timing and works out the drawing's size. Turning them into crayon
 * passes is the expensive part, and happens in a worker (passes.ts).
 * `pxPerUnit`: the drawing's exact on-screen scale, if known, so edge lines too thin to see can be dropped.
 */
export function finishPlan(
  raw: RawStroke[],
  m: number,
  speed: number,
  weight: number,
  rng: Rng,
  frame?: Frame,
  pxPerUnit?: number,
): CrayonPlan {
  const W = weight * CAP;
  // crayon moves ~1.2 cap heights per 100ms at speed 1
  const penSpeed = 1.2 * speed;
  let t = 0;
  const allPts: Point[] = [];

  const strokes = raw.map((s): PlannedStroke => {
    const width = W * (1 + gauss(rng) * 0.08);
    const seed = Math.floor(rng() * 4294967296);
    for (const p of s.pts) allPts.push(p);
    t += s.pause / speed;
    const duration = Math.max(70, (polylineLength(s.pts) / penSpeed) * (1 + gauss(rng) * 0.12));
    const line = new Float32Array(s.pts.length * 2);
    s.pts.forEach((p, i) => {
      line[i * 2] = p.x;
      line[i * 2 + 1] = p.y;
    });
    const planned = { line, width, seed, delay: t, duration, colour: s.colour };
    t += duration;
    return planned;
  });

  const b = bounds(allPts);
  // room for the line's width, plus how far the passes can wander off the centre line (see crayonPasses)
  const pad = W * 1.9 + 2.3 * m;
  const vb = frame ?? { x: b.minX - pad, y: b.minY - pad, w: b.maxX - b.minX + pad * 2, h: b.maxY - b.minY + pad * 2 };
  return {
    strokes,
    viewBox: [vb.x, vb.y, vb.w, vb.h].map(round).join(' '),
    width: vb.w,
    height: vb.h,
    totalDuration: t,
    lineWidth: W,
    messiness: m,
    pxPerUnit,
  };
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
