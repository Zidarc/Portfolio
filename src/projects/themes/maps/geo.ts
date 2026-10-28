/* Geometry for the GeoCode treasure map. Everything is in one 320 x 200 viewBox. */
import { createRng, type Rng } from '../../../crayon/random.ts';

export type P = readonly [number, number];

export const W = 320;
export const H = 200;

const f = (n: number) => n.toFixed(1);

/** Break a polyline into ~`step`-unit pieces and nudge each new point sideways a little. */
export function jitter(points: readonly P[], rng: Rng, amp = 0.8, step = 9): P[] {
  const out: P[] = [points[0]!];
  for (let i = 1; i < points.length; i++) {
    const [px, py] = points[i - 1]!;
    const [x, y] = points[i]!;
    const len = Math.hypot(x - px, y - py) || 1;
    const nx = -(y - py) / len;
    const ny = (x - px) / len;
    const n = Math.max(1, Math.round(len / step));
    for (let s = 1; s <= n; s++) {
      const t = s / n;
      const w = s === n ? 0 : (rng() * 2 - 1) * amp;
      out.push([px + (x - px) * t + nx * w, py + (y - py) * t + ny * w]);
    }
  }
  return out;
}

/** Catmull-Rom through the points, as cubic Béziers: a smooth, hand-drawn-looking curve. */
export function smooth(pts: readonly P[]): string {
  let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** A wobbly crayon line (straight segments) through the points. */
export function wobbly(points: readonly P[], rng: Rng, amp = 0.6, step = 9): string {
  return jitter(points, rng, amp, step)
    .map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`)
    .join('');
}

/** A wobbly closed box, drawn like a kid: the end overshoots the start a little. */
export function wobblyBox(x1: number, y1: number, x2: number, y2: number, rng: Rng, amp = 0.7): string {
  const j = () => (rng() * 2 - 1) * amp;
  const pts: P[] = [
    [x1 + j(), y1 + j()],
    [x2 + j(), y1 + j()],
    [x2 + j(), y2 + j()],
    [x1 + j(), y2 + j()],
  ];
  return wobbly([...pts, [pts[0]![0] + 0.3, pts[0]![1] - 0.4], [pts[0]![0] + 4, pts[0]![1] - 0.8]], rng, amp * 0.6, 14);
}

/* ---------- the places ---------- */

/** Pin tips: where each geocoded address lands. */
export const PIN_A: P = [216, 80]; // NED University
export const PIN_B: P = [114, 142]; // Clifton Beach

export const ADDR_A = 'NED University, Karachi';
export const ADDR_B = 'Clifton Beach, Karachi';
export const DISTANCE = '16.3 km';

/** Coast of the Arabian Sea, west to east: Manora's little hook, the Clifton curve, Korangi creek. */
const COAST: P[] = [
  [-4, 124],
  [10, 122],
  [22, 128],
  [28, 139],
  [36, 150],
  [43, 149],
  [41, 139],
  [47, 132],
  [58, 133],
  [70, 140],
  [84, 145],
  [100, 145],
  [116, 150],
  [136, 157],
  [158, 160],
  [180, 163],
  [204, 162],
  [226, 167],
  [248, 169],
  [260, 165],
  [268, 171],
  [290, 175],
  [324, 176],
];

/** The measuring line from B to A bows a little, like a string pulled across the map. */
function measure() {
  const [bx, by] = PIN_B;
  const [ax, ay] = PIN_A;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const len = Math.hypot(ax - bx, ay - by);
  const px = -(ay - by) / len;
  const py = (ax - bx) / len;
  const cx = mx - px * 22;
  const cy = my - py * 22;
  const at = (t: number): P => [
    (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cx + t * t * ax,
    (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy + t * t * ay,
  ];
  // even spacing along the curve: sample finely, then walk it
  const fine = Array.from({ length: 201 }, (_, i) => at(i / 200));
  const dots: P[] = [];
  const gap = 7;
  let acc = gap * 0.6;
  for (let i = 1; i < fine.length; i++) {
    const [x0, y0] = fine[i - 1]!;
    const [x1, y1] = fine[i]!;
    acc += Math.hypot(x1 - x0, y1 - y0);
    if (acc >= gap) {
      acc = 0;
      dots.push(fine[i]!);
    }
  }
  // keep clear of the pin tips at both ends
  const clear = dots.filter(([x, y]) => Math.hypot(x - bx, y - by) > 4 && Math.hypot(x - ax, y - ay) > 4);
  return { dots: clear, mid: at(0.5) };
}

export const MEASURE = measure();

/* ---------- static crayon drawing, computed once ---------- */

export const MAP = (() => {
  const rng = createRng(1947);
  const coastPts = jitter(COAST, rng, 1.1, 7);
  const coast = smooth(coastPts);
  const shifted = (dy: number) => smooth(coastPts.map(([x, y]) => [x, y + dy] as P));

  const road = (pts: P[], amp = 0.9) => smooth(jitter(pts, rng, amp, 12));

  return {
    coast,
    coastEcho: smooth(jitter(COAST, rng, 1.4, 7)),
    sea: `${coast}L330 210L-10 210Z`,
    surf1: shifted(4.5),
    surf2: shifted(9),
    rivers: [
      road([[64, 34], [70, 60], [66, 88], [76, 112], [72, 132], [78, 141]], 1.5),
      road([[262, 74], [254, 100], [262, 128], [256, 150], [262, 166]], 1.5),
    ],
    mainRoads: [
      road([[50, 131], [90, 118], [140, 113], [196, 101], [250, 86], [324, 62]]),
      road([[118, 34], [176, 56], [236, 96], [290, 124], [324, 130]]),
    ],
    roads: [
      road([[-4, 82], [44, 74], [96, 54], [128, 30]]),
      road([[96, 30], [100, 70], [106, 104], [112, 140]]),
      road([[232, -4], [226, 40], [220, 76]]),
      road([[220, 84], [208, 128], [212, 162]]),
      road([[150, 113], [146, 140], [140, 156]]),
      road([[-4, 104], [30, 108], [60, 126]]),
      road([[290, 124], [300, 150], [306, 174]]),
    ],
    grid: [
      ...[64, 128, 192, 256].map((x) => wobbly([[x, 0], [x, 200]], rng, 0.5, 20)),
      ...[50, 100, 150].map((y) => wobbly([[0, y], [320, y]], rng, 0.5, 20)),
    ],
    search: wobblyBox(9, 8, 198, 30, rng, 0.8),
    searchEcho: wobblyBox(9.6, 8.6, 197.4, 29.4, rng, 1),
    frame: wobblyBox(3, 3, 317, 197, rng, 0.9),
    tag: wobblyBox(-20, -8.5, 20, 7.5, rng, 0.6),
    scaleBar: wobbly([[262, 186], [298, 186]], rng, 0.3, 9),
    scaleTicks: wobbly([[262, 183], [262, 189]], rng, 0.2) + wobbly([[280, 184], [280, 188]], rng, 0.2) + wobbly([[298, 183], [298, 189]], rng, 0.2),
    xA: wobbly([[-5, -5], [5, 5]], rng, 0.5, 4),
    xB: wobbly([[5, -5.5], [-5, 5]], rng, 0.5, 4),
  };
})();

/** Schools and universities from the GeoCode datasets (positions are made up, the vibe is not). */
export const SCHOOLS: P[] = [
  [30, 48],
  [132, 70],
  [92, 92],
  [194, 146],
  [244, 120],
  [304, 150],
  [44, 104],
];

export const UNIS: P[] = [
  [182, 64],
  [276, 88],
  [70, 70],
  [232, 148],
];

/** Little "~" waves out at sea: x, y, scale, delay seconds. */
export const WAVES: [number, number, number, number][] = [
  [14, 166, 1, 0],
  [62, 160, 0.9, -1.4],
  [104, 172, 1.1, -0.6],
  [176, 180, 1, -2.2],
  [220, 186, 0.85, -1],
  [140, 194, 0.8, -2.8],
  [276, 198, 0.9, -1.8],
  [24, 192, 0.9, -0.3],
];
