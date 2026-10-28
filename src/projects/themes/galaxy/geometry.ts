/**
 * Crayon geometry for the galaxy scene. Everything is in scene units: the scene is a 320 x 200
 * sheet (16:10, same as the window), so one unit is 100cqw / 320 in CSS.
 */
import { createRng, type Rng } from '../../../crayon/random.ts';

export type Pt = readonly [number, number];

const f = (n: number) => n.toFixed(1);
const jit = (rng: Rng, amp: number) => (rng() * 2 - 1) * amp;

/** A hand-drawn line through the points: each point nudged, each span bowed a little. */
export function wobble(pts: readonly Pt[], rng: Rng, amp = 0.6, closed = false): string {
  const p = pts.map(([x, y]) => [x + jit(rng, amp), y + jit(rng, amp)] as const);
  if (closed && p[0]) p.push([p[0][0] + jit(rng, amp), p[0][1] + jit(rng, amp)]);
  const first = p[0];
  if (!first) return '';
  let d = `M${f(first[0])} ${f(first[1])}`;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]!;
    const b = p[i]!;
    d += `Q${f((a[0] + b[0]) / 2 + jit(rng, amp))} ${f((a[1] + b[1]) / 2 + jit(rng, amp))} ${f(b[0])} ${f(b[1])}`;
  }
  return d;
}

/** Smooth closed curve through points (Catmull-Rom as cubic Béziers). */
function smoothClosed(p: readonly Pt[]): string {
  const n = p.length;
  const at = (i: number) => p[((i % n) + n) % n]!;
  let d = `M${f(at(0)[0])} ${f(at(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

/** A lumpy kid circle. */
export function blob(cx: number, cy: number, r: number, rng: Rng, lump = 0.05, n = 12): string {
  const off = rng() * Math.PI * 2;
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = off + (i / n) * Math.PI * 2;
    const rr = r * (1 + jit(rng, lump));
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  return smoothClosed(pts);
}

/** A lumpy ellipse, rotated by `rot` degrees. */
export function ellipse(cx: number, cy: number, rx: number, ry: number, rot: number, rng: Rng, lump = 0.03): string {
  const n = 16;
  const t = (rot * Math.PI) / 180;
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + jit(rng, lump);
    const x = Math.cos(a) * rx * k;
    const y = Math.sin(a) * ry * k;
    return [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)];
  });
  return smoothClosed(pts);
}

/** Kid star: `spikes` points, chunky inner radius, slightly lopsided. */
export function star(cx: number, cy: number, r: number, rng: Rng, spikes = 5, inner = 0.48, rot = -90): string {
  const pts: Pt[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = ((rot + (i * 180) / spikes) * Math.PI) / 180 + jit(rng, 0.06);
    const rr = (i % 2 ? r * inner : r) * (1 + jit(rng, 0.08));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`;
}

/**
 * Back-and-forth colouring strokes filling a box, like a kid colouring in the sky.
 * `slant` is how far the bottom of each stroke leans right of its top.
 */
export function scribble(x0: number, y0: number, x1: number, y1: number, step: number, slant: number, rng: Rng): string {
  let d = '';
  let x = x0;
  let down = true;
  d += `M${f(x)} ${f(y0 + jit(rng, 3))}`;
  while (x < x1 + slant) {
    const nx = x + step * (0.75 + rng() * 0.5);
    const ty = down ? y1 + jit(rng, 4) : y0 + jit(rng, 4);
    const tx = down ? nx + slant : nx;
    d += `L${f(tx)} ${f(ty)}`;
    x = nx;
    down = !down;
  }
  return d;
}

/* ---------- layout ---------- */

export interface Node {
  x: number;
  y: number;
  /** seconds after activation that the line reaches this star and it lights up */
  at: number;
  big?: boolean;
}

export interface Edge {
  x: number;
  y: number;
  len: number;
  /** degrees */
  angle: number;
  /** seconds */
  delay: number;
  dur: number;
  kind: 'main' | 'branch' | 'gcc';
}

/** A constellation line from a to b, stopping `gapA` / `gapB` short of the stars at each end. */
function edge(a: Pt, b: Pt, delay: number, dur: number, kind: Edge['kind'], gapA = 3.6, gapB = gapA): Edge {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const full = Math.hypot(dx, dy);
  return {
    x: a[0] + (dx / full) * gapA,
    y: a[1] + (dy / full) * gapA,
    len: Math.max(0, full - gapA - gapB),
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    delay,
    dur,
    kind,
  };
}

/* The commit graph: `main` along the top, a feature branch dipping below and merging back in. */
const MAIN: Pt[] = [
  [130, 36],
  [158, 30],
  [188, 37],
  [217, 31],
  [248, 37],
  [276, 29],
];
const BRANCH: Pt[] = [
  [175, 63],
  [207, 67],
];
const STEP = 0.32;
const BR_START = 0.42;

export const GRAPH_EDGES: Edge[] = [
  ...MAIN.slice(1).map((p, i) => edge(MAIN[i]!, p, i * STEP, STEP, 'main', i === 4 ? 6.5 : 3.6, i === 3 ? 6.5 : 3.6)),
  edge(MAIN[1]!, BRANCH[0]!, BR_START, 0.3, 'branch'),
  edge(BRANCH[0]!, BRANCH[1]!, BR_START + 0.3, 0.3, 'branch'),
  edge(BRANCH[1]!, MAIN[4]!, BR_START + 0.6, 0.34, 'branch', 3.6, 6.5),
];

export const GRAPH_NODES: Node[] = [
  ...MAIN.map(([x, y], i) => ({ x, y, at: i * STEP, big: i === 4 })),
  { x: BRANCH[0]![0], y: BRANCH[0]![1], at: BR_START + 0.3 },
  { x: BRANCH[1]![0], y: BRANCH[1]![1], at: BR_START + 0.6 },
];

/* "GCC" in stars, top left. */
const LETTERS: Pt[][] = [
  // G
  [
    [41, 19],
    [30, 13],
    [19, 20],
    [16, 33],
    [23, 44],
    [35, 46],
    [42, 37],
    [33, 35],
  ],
  // C
  [
    [72, 18],
    [61, 13],
    [51, 22],
    [50, 36],
    [59, 46],
    [72, 43],
  ],
  // C
  [
    [104, 18],
    [93, 13],
    [83, 22],
    [82, 36],
    [91, 46],
    [104, 43],
  ],
];
const GCC_START = 1.75;
const GCC_STEP = 0.13;

export const GCC_EDGES: Edge[] = [];
export const GCC_NODES: Node[] = [];
{
  let t = GCC_START;
  for (const letter of LETTERS) {
    letter.forEach(([x, y], i) => {
      if (i > 0) {
        GCC_EDGES.push(edge(letter[i - 1]!, [x, y], t, GCC_STEP, 'gcc', 2.8));
        t += GCC_STEP;
      }
      GCC_NODES.push({ x, y, at: t });
    });
    t += 0.12;
  }
}

export const PLANET = { cx: 62, cy: 168, r: 34 };
export const MOON = { cx: 300, cy: 70, r: 12 };
/** where the rocket stands on the big planet (bottom-centre of the rocket) */
export const PAD = { x: 70, y: 135.5 };

/* background stars, sorted into three twinkle groups that pulse out of step */
export const BG_STARS: { x: number; y: number; r: number; kind: 'dot' | 'plus' }[][] = (() => {
  const rng = createRng(2024);
  const keepOut = [
    [10, 8, 112, 52], // GCC
    [122, 22, 286, 74], // commit graph
    [20, 126, 110, 200], // big planet
    [214, 88, 288, 178], // astronaut
    [282, 52, 320, 88], // moon
  ];
  const groups: { x: number; y: number; r: number; kind: 'dot' | 'plus' }[][] = [[], [], []];
  let tries = 0;
  let placed = 0;
  while (placed < 42 && tries < 2000) {
    tries++;
    const x = 4 + rng() * 312;
    const y = 4 + rng() * 192;
    if (keepOut.some(([a, b, c, d]) => x > a! && x < c! && y > b! && y < d!)) continue;
    const big = rng() < 0.25;
    groups[placed % 3]!.push({ x, y, r: big ? 1.6 + rng() * 0.8 : 0.6 + rng() * 0.6, kind: big ? 'plus' : 'dot' });
    placed++;
  }
  return groups;
})();

/** a few big yellow kid-stars that twinkle on their own */
export const HERO_STARS = [
  { x: 120, y: 98, r: 6, t: 3.2, d: -0.4 },
  { x: 300, y: 112, r: 4.6, t: 4.1, d: -2.1 },
  { x: 14, y: 96, r: 5, t: 3.7, d: -1.2 },
  { x: 196, y: 186, r: 4.2, t: 4.6, d: -3 },
  { x: 312, y: 168, r: 3.8, t: 3.4, d: -1.7 },
];
