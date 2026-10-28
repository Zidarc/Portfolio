/**
 * Hand-drawn shapes for the themed scenes. Every scene is a 320 x 200 sheet: static art goes in one
 * SVG with that viewBox, and the few moving parts are HTML layers placed with `at()` in the same units
 * (the scene sets --u = 100cqw / 320), so they animate on the compositor instead of repainting the SVG.
 */
import type { CSSProperties } from 'react';
import { smoothPath } from '../crayon/geometry.ts';
import type { Rng } from '../crayon/random.ts';

export type Pt = [number, number];
export type Vars = CSSProperties & Record<`--${string}`, string | number>;

const jitter = (rng: Rng, amt: number) => (rng() * 2 - 1) * amt;

/** A slightly shaky line through the points: each segment is split in `steps` and nudged by up to `amt`. */
export function wobbly(points: Pt[], rng: Rng, amt = 0.5, steps = 3): string {
  const pts: { x: number; y: number }[] = [];
  points.forEach(([x0, y0], i) => {
    const next = points[i + 1];
    if (!next) return;
    const [x1, y1] = next;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const j = i === 0 && s === 0 ? 0 : amt;
      pts.push({ x: x0 + (x1 - x0) * t + jitter(rng, j), y: y0 + (y1 - y0) * t + jitter(rng, j) });
    }
  });
  const last = points[points.length - 1];
  if (last) pts.push({ x: last[0], y: last[1] });
  return smoothPath(pts);
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A closed hand-drawn polygon: sharp corners, each side bowing a little as if drawn freehand. */
export function wobblyShape(points: Pt[], rng: Rng, amt = 0.4): string {
  if (points.length < 2) return '';
  const corners = points.map(([x, y]) => [x + jitter(rng, amt), y + jitter(rng, amt)] as Pt);
  let d = `M${r1(corners[0]![0])} ${r1(corners[0]![1])}`;
  corners.forEach((a, i) => {
    const b = corners[(i + 1) % corners.length]!;
    const mx = (a[0] + b[0]) / 2 + jitter(rng, amt * 1.4);
    const my = (a[1] + b[1]) / 2 + jitter(rng, amt * 1.4);
    d += `Q${r1(mx)} ${r1(my)} ${r1(b[0])} ${r1(b[1])}`;
  });
  return `${d}Z`;
}

export const wobblyRect = (x: number, y: number, w: number, h: number, rng: Rng, amt = 0.4) =>
  wobblyShape(
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    rng,
    amt,
  );

/** A lumpy ellipse; `wob` is how far the radius strays (0.05 = 5%). */
export function wobblyEllipse(cx: number, cy: number, rx: number, ry: number, rng: Rng, wob = 0.04): string {
  const n = 14;
  const start = rng() * Math.PI * 2;
  const k = Array.from({ length: n }, () => 1 + jitter(rng, wob));
  const pts = Array.from({ length: n + 2 }, (_, i) => {
    const a = start + (i / n) * Math.PI * 2;
    const r = k[i % n]!;
    return { x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r };
  });
  return `${smoothPath(pts)}Z`;
}

/** Place an HTML layer on the sheet: pair with a class that reads --x/--y/--w/--h (see each theme's *-at). */
export const at = (x: number, y: number, w: number, h?: number, extra: Vars = {}): Vars => ({
  '--x': x,
  '--y': y,
  '--w': w,
  ...(h === undefined ? {} : { '--h': h }),
  ...extra,
});
