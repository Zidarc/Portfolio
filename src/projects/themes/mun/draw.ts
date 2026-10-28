/** Tiny crayon geometry helpers: hand-wobbled lines, shapes and blobs as SVG path data. */
import { createRng, type Rng } from '../../../crayon/random.ts';

export type Pt = readonly [number, number];

const f = (n: number) => String(Math.round(n * 10) / 10);

/** One shared, seeded pen so the drawing is identical on every load. */
export const pen: Rng = createRng(2611);

/** A wobbly polyline (or closed polygon with a little crayon overshoot at the end). */
export function wob(points: readonly Pt[], amp = 0.45, closed = false, rng: Rng = pen): string {
  const pts = closed ? [...points, points[0]!] : [...points];
  let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1]!;
    const [x, y] = pts[i]!;
    const len = Math.hypot(x - px, y - py) || 1;
    const nx = -(y - py) / len;
    const ny = (x - px) / len;
    const steps = Math.max(1, Math.round(len / 9));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const w = s === steps ? 0 : (rng() * 2 - 1) * amp;
      d += `L${f(px + (x - px) * t + nx * w)} ${f(py + (y - py) * t + ny * w)}`;
    }
  }
  if (closed && pts.length > 2) {
    // the crayon runs a little past where it started
    const [ax, ay] = pts[0]!;
    const [bx, by] = pts[1]!;
    const t = Math.min(0.25, 4 / (Math.hypot(bx - ax, by - ay) || 1));
    d += `L${f(ax + (bx - ax) * t + (rng() - 0.5) * amp)} ${f(ay + (by - ay) * t + (rng() - 0.5) * amp)}`;
  }
  return d;
}

/** A wobbly rectangle. */
export const box = (x1: number, y1: number, x2: number, y2: number, amp = 0.4) =>
  wob(
    [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
    ],
    amp,
    true,
  );

/** A smooth, slightly lumpy closed loop (heads, bubbles, clouds). */
export function blob(cx: number, cy: number, rx: number, ry: number, lump = 0.07, n = 9, rng: Rng = pen): string {
  const a0 = rng() * Math.PI * 2;
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = a0 + (i / n) * Math.PI * 2;
    const k = 1 + (rng() * 2 - 1) * lump;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  return smoothClosed(pts);
}

/** Catmull-Rom through closed points, as cubic Béziers. */
export function smoothClosed(pts: readonly Pt[]): string {
  const n = pts.length;
  const p = (i: number) => pts[((i % n) + n) % n]!;
  let d = `M${f(p(0)[0])} ${f(p(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p(i - 1);
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    const [x3, y3] = p(i + 2);
    d +=
      `C${f(x1 + (x2 - x0) / 6)} ${f(y1 + (y2 - y0) / 6)} ` +
      `${f(x2 - (x3 - x1) / 6)} ${f(y2 - (y3 - y1) / 6)} ${f(x2)} ${f(y2)}`;
  }
  return d;
}

/** A five-pointed doodle star. */
export function star(cx: number, cy: number, r: number, inner = 0.45): string {
  const pts: Pt[] = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * inner : r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  return `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;
}
