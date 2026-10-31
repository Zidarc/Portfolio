import type { Point } from './geometry.ts';
import { createNoise1D, createRng, gauss, range, type Rng } from './random.ts';
import type { CrayonStyle } from './style.ts';
import { finishPlan, handDrawn, type CrayonPlan, type Frame, type RawStroke } from './strokes.ts';

/**
 * Kid drawings as ordered strokes, in the same units as handwriting (100 = a capital letter's height).
 * Each is a function of the rng so circles overshoot and petals vary a little every time.
 */
interface DoodleStroke {
  pts: Point[];
  colour?: string;
}

type DoodleFn = (rng: Rng, m: number) => DoodleStroke[];

const crayon = (name: string) => `var(--crayon-${name})`;

// ---------- shape helpers ----------

const p = (x: number, y: number): Point => ({ x, y });

function quad(a: Point, c: Point, b: Point, n = 14): Point[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return p(u * u * a.x + 2 * u * t * c.x + t * t * b.x, u * u * a.y + 2 * u * t * c.y + t * t * b.y);
  });
}

/** Joins curve pieces, dropping each piece's duplicated first point. */
const chain = (...pieces: Point[][]) => pieces.flatMap((piece, i) => (i === 0 ? piece : piece.slice(1)));

/**
 * A kid's circle: starts near the top, goes anticlockwise, and doesn't quite know when to stop.
 * `from`/`sweep` in radians (negative sweep = anticlockwise on screen).
 */
function loop(cx: number, cy: number, rx: number, ry: number, rng: Rng, m: number, from = -Math.PI / 2, sweep?: number): Point[] {
  const total = sweep ?? -(Math.PI * 2 + range(rng, 0.05, 0.4) * m);
  const squashX = 1 + gauss(rng) * 0.05 * m;
  const squashY = 1 + gauss(rng) * 0.05 * m;
  const n = Math.max(12, Math.round((Math.abs(total) * Math.max(rx, ry)) / 6));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = from + (total * i) / n;
    // radius drifts a little as the hand goes round
    const drift = 1 + Math.sin(a * 2 + rng() * 0.3) * 0.03 * m;
    return p(cx + Math.cos(a) * rx * squashX * drift, cy + Math.sin(a) * ry * squashY * drift);
  });
}

/** A petal or leaf drawn as one loop out from `base` and back, pointing at `angle`. */
function petal(base: Point, angle: number, length: number, width: number): Point[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return Array.from({ length: 25 }, (_, i) => {
    const t = i / 24;
    const lx = (length * (1 - Math.cos(2 * Math.PI * t))) / 2;
    const ly = (width / 2) * Math.sin(2 * Math.PI * t);
    return p(base.x + lx * cos - ly * sin, base.y + lx * sin + ly * cos);
  });
}

const mirror = (pts: Point[]) => pts.map((q) => p(-q.x, q.y));

// ---------- the doodles ----------

/** One ✦ drawn as two halves, `)` then `(`, with sides curving in toward the middle. */
function star(cx: number, cy: number, size: number): DoodleStroke[] {
  const at = (x: number, y: number) => p(cx + x * size, cy + y * size);
  const pinch = 3;
  return [
    { pts: chain(quad(at(0, -66), at(-pinch, -pinch), at(-50, 0)), quad(at(-50, 0), at(-pinch, pinch), at(0, 66))) },
    { pts: chain(quad(at(0, -66), at(pinch, -pinch), at(50, 0)), quad(at(50, 0), at(pinch, pinch), at(0, 66))) },
  ];
}

/** A big ✦ and then a small one up beside it. */
const sparkle: DoodleFn = () => [...star(0, 0, 1), ...star(78, -58, 0.42)];

/** Sitting cat: head, ears, face, whiskers, body, feet, curly tail. */
const cat: DoodleFn = (rng, m) => {
  const whiskers = [
    [p(-20, 6), p(-54, -1)],
    [p(-20, 11), p(-56, 12)],
    [p(-20, 16), p(-51, 25)],
  ];
  const parts: DoodleStroke[] = [
    { pts: loop(0, 0, 42, 38, rng, m) },
    { pts: [p(-34, -21), p(-30, -64), p(-10, -37)] },
    { pts: [p(10, -37), p(30, -64), p(34, -21)] },
    { pts: loop(-15, -8, 4.5, 5, rng, m) },
    { pts: loop(15, -8, 4.5, 5, rng, m) },
    { pts: [p(-5, 4), p(5, 4), p(0, 10), p(-5, 4)] },
    { pts: chain(quad(p(-12, 13), p(-6, 22), p(0, 12)), quad(p(0, 12), p(6, 22), p(12, 13))) },
    ...whiskers.map((w) => ({ pts: w })),
    ...whiskers.map((w) => ({ pts: mirror(w) })),
    { pts: loop(0, 78, 36, 44, rng, m, -Math.PI / 2 - 0.72, -(Math.PI * 2 - 1.44)) },
    { pts: quad(p(-23, 117), p(-14, 130), p(-5, 118)) },
    { pts: quad(p(5, 118), p(14, 130), p(23, 117)) },
    { pts: chain(quad(p(31, 100), p(72, 104), p(66, 70)), quad(p(66, 70), p(62, 46), p(47, 53))) },
  ];
  // drawn big so the crayon stays thin next to the face details
  return parts.map((s) => ({ ...s, pts: s.pts.map((q) => p(q.x * 1.45, q.y * 1.45)) }));
};

/** Flower: orange middle (coloured in), red petals all the way round, green stem with two leaves. */
const flower: DoodleFn = (rng, m) => {
  const petals = 6;
  const spin = rng() * Math.PI;
  const centre = p(0, -24);
  const petalStrokes = Array.from({ length: petals }, (_, k) => {
    const a = spin + (k * Math.PI * 2) / petals + gauss(rng) * 0.08 * m;
    const base = p(centre.x + Math.cos(a) * 19, centre.y + Math.sin(a) * 19);
    return {
      pts: petal(base, a, 36 * (1 + gauss(rng) * 0.1 * m), 28 * (1 + gauss(rng) * 0.1 * m)),
      colour: crayon('red'),
    };
  });
  // colouring the middle in with a quick zigzag
  const scribble = Array.from({ length: 7 }, (_, i) => p(centre.x + (i % 2 ? 8 : -8), centre.y - 9 + i * 3));
  return [
    { pts: loop(centre.x, centre.y, 15, 15, rng, m), colour: crayon('orange') },
    { pts: scribble, colour: crayon('orange') },
    ...petalStrokes,
    { pts: quad(p(0, 12), p(10, 78), p(1, 145)), colour: crayon('green') },
    { pts: petal(p(4, 96), -Math.PI * 0.85, 42, 19), colour: crayon('green') },
    { pts: petal(p(3, 118), -Math.PI * 0.15, 40, 18), colour: crayon('green') },
  ];
};

/**
 * A kid circling a round photo (radius 100, centred on (0, 0)): one continuous scribble that goes
 * round about three times without lifting the crayon, the radius and centre drifting as it goes.
 * Uses RINGS_FRAME so the photo can be positioned underneath precisely.
 */
const rings: DoodleFn = (rng, m) => {
  const radiusDrift = createNoise1D(rng);
  const centreDriftX = createNoise1D(rng);
  const centreDriftY = createNoise1D(rng);
  const turns = range(rng, 2.6, 3.1);
  const from = -Math.PI / 2 + gauss(rng) * 0.9;
  const squashX = 1 + gauss(rng) * 0.04 * m;
  const squashY = 1 + gauss(rng) * 0.04 * m;
  const n = Math.round(turns * 96);

  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = (i / n) * turns; // turns completed so far
    const a = from - t * Math.PI * 2; // anticlockwise
    // spirals outward ~9 units a turn so the loops sit apart, wandering in and out as it goes
    // (kept ≥ 110 so even with the centre drifting it never crosses into the photo)
    const r = Math.max(110, 110 + t * 9 + radiusDrift(t * 1.6) * 6 * m);
    return p(centreDriftX(t * 0.8) * 4 * m + Math.cos(a) * r * squashX, centreDriftY(t * 0.8) * 4 * m + Math.sin(a) * r * squashY);
  });
  return [{ pts, colour: crayon('blue') }];
};

/** viewBox for `rings`: the photo (radius 100) fills the middle 200 of these 310 units. */
export const RINGS_FRAME = { x: -155, y: -155, w: 310, h: 310 };

/** Smiley face: stands in for a photo that hasn't loaded. */
const smiley: DoodleFn = (rng, m) => [
  { pts: loop(0, 0, 90, 90, rng, m) },
  { pts: loop(-32, -22, 8, 10, rng, m) },
  { pts: loop(32, -22, 8, 10, rng, m) },
  { pts: quad(p(-48, 22), p(0, 72), p(48, 22)) },
  // messy hair
  { pts: chain(quad(p(-50, -72), p(-30, -112), p(-14, -86)), quad(p(-14, -86), p(4, -118), p(16, -88)), quad(p(16, -88), p(38, -114), p(52, -70))) },
];

/** `-->`: a slightly bent shaft, then the head as one `>` stroke into the tip. */
const arrow: DoodleFn = (rng, m) => {
  const tip = p(100, gauss(rng) * 3 * m);
  return [
    { pts: quad(p(0, gauss(rng) * 3 * m), p(50, gauss(rng) * 7 * m), tip) },
    { pts: [p(76, -17 + gauss(rng) * 3 * m), tip, p(76, 17 + gauss(rng) * 3 * m)] },
  ];
};

/** Three crayon lines: the menu button. */
const menu: DoodleFn = (rng, m) =>
  [0, 28, 56].map((y) => ({ pts: quad(p(0, y), p(45, y + gauss(rng) * 4 * m), p(90 + gauss(rng) * 5 * m, y)) }));

/** An X: the close button. */
const cross: DoodleFn = () => [{ pts: [p(0, 0), p(70, 70)] }, { pts: [p(70, 0), p(0, 70)] }];

/** A long, gently wavy line: drawn under the header once the page scrolls. */
const underline: DoodleFn = (rng) => {
  const phase = rng() * Math.PI * 2;
  return [{ pts: Array.from({ length: 41 }, (_, i) => p(i * 25, Math.sin(i * 0.45 + phase) * 4)) }];
};

/** ✓ in one stroke. */
const check: DoodleFn = () => [{ pts: [p(0, 42), p(30, 74), p(96, 0)] }];

/** A small circle, then coloured in with a zigzag: timeline markers. */
const dot: DoodleFn = (rng, m) => [
  { pts: loop(0, 0, 14, 14, rng, m) },
  { pts: Array.from({ length: 6 }, (_, i) => p(i % 2 ? 8 : -8, -9 + i * 3.6)) },
];

// ---------- margin doodles: the little drawings that turn up beside each section ----------

/** ♥ in one go: up the left side, the dip, down the right side back to the point. */
const heart: DoodleFn = () => [
  {
    pts: chain(
      quad(p(0, 55), p(-78, 8), p(-50, -32)),
      quad(p(-50, -32), p(-30, -64), p(0, -28)),
      quad(p(0, -28), p(30, -64), p(50, -32)),
      quad(p(50, -32), p(78, 8), p(0, 58)),
    ),
  },
];

/** A round sun, then rays all the way round. */
const sun: DoodleFn = (rng, m) => [
  { pts: loop(0, 0, 32, 32, rng, m) },
  ...Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + gauss(rng) * 0.06 * m;
    const r0 = 44 + gauss(rng) * 3 * m;
    return { pts: [p(Math.cos(a) * r0, Math.sin(a) * r0), p(Math.cos(a) * (r0 + 20), Math.sin(a) * (r0 + 20))] };
  }),
];

/** A bumpy cloud in one stroke, flat along the bottom. */
const cloud: DoodleFn = () => [
  {
    pts: chain(
      [p(62, 26), p(-62, 26)],
      quad(p(-62, 26), p(-96, 14), p(-70, -6)),
      quad(p(-70, -6), p(-66, -46), p(-24, -30)),
      quad(p(-24, -30), p(2, -72), p(32, -34)),
      quad(p(32, -34), p(72, -40), p(62, -2)),
      quad(p(62, -2), p(88, 18), p(62, 26)),
    ),
  },
];

/** A fish swimming left, blowing two bubbles. */
const fish: DoodleFn = (rng, m) => [
  { pts: loop(0, 0, 55, 30, rng, m) },
  { pts: [p(50, 0), p(86, -26), p(84, 26), p(50, 0)] },
  { pts: loop(-28, -7, 4, 4, rng, m) },
  { pts: quad(p(-48, 10), p(-40, 18), p(-30, 12)) },
  { pts: loop(-80, -34, 7, 7, rng, m) },
  { pts: loop(-94, -60, 4.5, 4.5, rng, m) },
];

/**
 * The fish that swims down the page beside you (components/Fish.tsx), facing left. Its body and its tail
 * are separate drawings in one shared frame, so the tail can flap on its own layer.
 */
const swimmer: DoodleFn = (rng, m) => [
  { pts: loop(0, 0, 50, 28, rng, m) },
  { pts: quad(p(-8, -25), p(6, -44), p(24, -24)) },
  { pts: loop(-26, -7, 4, 4, rng, m) },
  { pts: quad(p(-45, 9), p(-38, 15), p(-30, 10)) },
  { pts: quad(p(4, -12), p(12, 0), p(4, 12)) },
];
const swimmerTail: DoodleFn = () => [{ pts: [p(46, 0), p(82, -26), p(76, 0), p(82, 26), p(46, 0)] }];
export const SWIMMER_FRAME = { x: -66, y: -56, w: 162, h: 96 };

/** A paper plane with a dashed swoosh behind it. */
const plane: DoodleFn = () => [
  { pts: [p(-70, 10), p(82, -42), p(-18, 42), p(-70, 10)] },
  { pts: [p(82, -42), p(-24, 14), p(-18, 42)] },
  { pts: [p(-88, 30), p(-106, 40)] },
  { pts: [p(-120, 47), p(-138, 58)] },
];

/** ⚡ in one zigzag. */
const bolt: DoodleFn = () => [
  { pts: [p(12, -72), p(-30, 4), p(4, 4), p(-14, 72), p(40, -16), p(6, -16), p(26, -72), p(12, -72)] },
];

/** A spiral, wound out from the middle. */
const spiral: DoodleFn = (rng, m) => {
  const start = rng() * Math.PI * 2;
  return [
    {
      pts: Array.from({ length: 70 }, (_, i) => {
        const t = i / 69;
        const a = start + t * Math.PI * 4.2;
        const r = 4 + t * 48 * (1 + gauss(rng) * 0.02 * m);
        return p(Math.cos(a) * r, Math.sin(a) * r);
      }),
    },
  ];
};

/** A rocket: body, window, fins, then the flame in another crayon. */
const rocket: DoodleFn = (rng, m) => [
  {
    pts: chain(
      quad(p(0, -78), p(26, -56), p(22, -24)),
      [p(22, -24), p(22, 36), p(-22, 36), p(-22, -24)],
      quad(p(-22, -24), p(-26, -56), p(0, -78)),
    ),
  },
  { pts: loop(0, -18, 9, 9, rng, m) },
  { pts: [p(-22, 12), p(-42, 44), p(-22, 38)] },
  { pts: [p(22, 12), p(42, 44), p(22, 38)] },
  { pts: [p(-12, 40), p(0, 74), p(12, 40)], colour: crayon('orange') },
];

/** Two joined music notes. */
const note: DoodleFn = (rng, m) => [
  { pts: loop(-22, 42, 14, 10, rng, m) },
  { pts: [p(-8, 42), p(-8, -44)] },
  { pts: loop(36, 32, 14, 10, rng, m) },
  { pts: [p(50, 32), p(50, -36)] },
  { pts: [p(-8, -44), p(50, -36)] },
];

/** Three arcs, one crayon each. */
const rainbow: DoodleFn = (rng, m) =>
  [
    ['red', 92],
    ['yellow', 74],
    ['blue', 56],
  ].map(([colour, r]) => ({
    pts: loop(0, 40, r as number, (r as number) * 0.8, rng, m, Math.PI, Math.PI),
    colour: crayon(colour as string),
  }));

/** A crescent moon in one stroke, and a tiny star. */
const moon: DoodleFn = () => [
  { pts: chain(quad(p(12, -56), p(-82, 0), p(12, 56)), quad(p(12, 56), p(-36, 0), p(12, -56))) },
  ...star(56, -40, 0.28),
];

/** A light bulb with its screw base and a few rays: an idea. */
const bulb: DoodleFn = () => [
  {
    pts: chain(
      quad(p(-18, 24), p(-52, -10), p(-32, -46)),
      quad(p(-32, -46), p(0, -78), p(32, -46)),
      quad(p(32, -46), p(52, -10), p(18, 24)),
    ),
  },
  { pts: [p(-18, 26), p(18, 26)] },
  { pts: [p(-16, 36), p(16, 36)] },
  { pts: [p(-11, 46), p(11, 46)] },
  { pts: [p(-56, -62), p(-70, -76)] },
  { pts: [p(0, -90), p(0, -108)] },
  { pts: [p(56, -62), p(70, -76)] },
];

/** A crown (it's a hat, after all), with two jewels. */
const crown: DoodleFn = (rng, m) => [
  { pts: [p(-56, 30), p(-62, -32), p(-30, 0), p(0, -48), p(30, 0), p(62, -32), p(56, 30), p(-56, 30)] },
  { pts: loop(-22, 14, 6, 6, rng, m), colour: crayon('red') },
  { pts: loop(22, 14, 6, 6, rng, m), colour: crayon('blue') },
];

export const DOODLES = {
  sparkle,
  cat,
  flower,
  rings,
  smiley,
  arrow,
  menu,
  cross,
  underline,
  check,
  dot,
  heart,
  sun,
  cloud,
  fish,
  swimmer,
  swimmerTail,
  plane,
  bolt,
  spiral,
  rocket,
  note,
  rainbow,
  moon,
  bulb,
  crown,
} satisfies Record<string, DoodleFn>;
export type DoodleName = keyof typeof DOODLES;

const FRAMES: Partial<Record<DoodleName, Frame>> = { rings: RINGS_FRAME, swimmer: SWIMMER_FRAME, swimmerTail: SWIMMER_FRAME };

/** Long lines where even a few degrees of tilt turns into a slope across the screen. */
const NO_TILT: ReadonlySet<DoodleName> = new Set(['underline', 'swimmer', 'swimmerTail']);

export interface DoodleOptions extends CrayonStyle {
  seed: number;
}

export function planDoodle(name: DoodleName, opts: DoodleOptions): CrayonPlan {
  const m = opts.messiness;
  const rng = createRng(opts.seed);
  const tilt = NO_TILT.has(name) ? 0 : (gauss(rng) * 4 * m * Math.PI) / 180;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);

  const raw: RawStroke[] = DOODLES[name](rng, m).map((s, i) => {
    // each part comes out a slightly different size than planned
    const cx = s.pts.reduce((a, q) => a + q.x, 0) / s.pts.length;
    const cy = s.pts.reduce((a, q) => a + q.y, 0) / s.pts.length;
    const k = NO_TILT.has(name) ? 1 : 1 + gauss(rng) * 0.05 * m;
    const pts = s.pts.map((q) => {
      const x = cx + (q.x - cx) * k;
      const y = cy + (q.y - cy) * k;
      return p(x * cos - y * sin, x * sin + y * cos);
    });
    return { pts: handDrawn(pts, m, rng), colour: s.colour, pause: i === 0 ? range(rng, 40, 90) : range(rng, 80, 180) };
  });

  return finishPlan(raw, m, opts.speed, opts.weight, rng, FRAMES[name]);
}
