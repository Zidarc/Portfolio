export interface Point {
  x: number;
  y: number;
}

export function polylineLength(pts: Point[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
  return len;
}

/**
 * Inserts points so no segment is longer than `spacing`, keeping the original corners.
 * Dense points let the wobble bend straight lines.
 */
export function resample(pts: Point[], spacing: number): Point[] {
  const out: Point[] = [pts[0]!];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / spacing));
    for (let k = 1; k <= n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  return out;
}

/** Moves the start backwards / the end forwards along the stroke direction (negative = shorten). */
export function extendEnds(pts: Point[], startBy: number, endBy: number): Point[] {
  if (pts.length < 2) return pts;
  const out = pts.slice();
  const push = (from: Point, toward: Point, by: number): Point => {
    const dx = from.x - toward.x;
    const dy = from.y - toward.y;
    const d = Math.hypot(dx, dy) || 1;
    return { x: from.x + (dx / d) * by, y: from.y + (dy / d) * by };
  };
  out[0] = push(pts[0]!, pts[1]!, startBy);
  out[out.length - 1] = push(pts[pts.length - 1]!, pts[pts.length - 2]!, endBy);
  return out;
}

/** Unit normal at each point (average of neighbouring segment directions). */
export function normals(pts: Point[]): Point[] {
  return pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(pts.length - 1, i + 1)]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    return { x: -dy / d, y: dx / d };
  });
}

const f = (n: number) => Math.round(n * 10) / 10;

/** Catmull-Rom spline through the points, as an SVG path of cubic Béziers. */
export function smoothPath(pts: Point[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${f(pts[0]!.x)} ${f(pts[0]!.y)}h0.1`;
  let d = `M${f(pts[0]!.x)} ${f(pts[0]!.y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}
