/**
 * Crayon drawings for the Negotium coin scene. Every piece is a small static SVG drawn once;
 * Scene.tsx only moves the boxes they live in (transform / opacity).
 * Scene units: the window is 320 x 200.
 */
import { createRng, type Rng } from '../../../crayon/random.ts';

/* ---------- hand-drawn geometry ---------- */

type Pt = [number, number];

const f = (n: number) => n.toFixed(2);

/** Catmull-Rom through the points, as cubic Béziers. */
function smooth(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** A wobbly ellipse that overshoots its start a little, like a crayon circle. */
export function blob(cx: number, cy: number, rx: number, ry: number, rng: Rng, wob = 0.05, over = 0.3): string {
  const n = 12;
  const a0 = rng() * Math.PI * 2;
  const pts: Pt[] = [];
  const k: number[] = Array.from({ length: n }, () => 1 + (rng() * 2 - 1) * wob);
  for (let i = 0; i <= n + 1; i++) {
    const t = i / n;
    const a = a0 + t * (Math.PI * 2 + over);
    const r = i >= n ? 1 + (i - n) * 0.03 : k[i]!;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  return smooth(pts);
}

/** A slightly shaky line through the given points. */
export function shaky(points: Pt[], rng: Rng, amt = 0.5, steps = 3): string {
  const pts: Pt[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]!;
    const [x1, y1] = points[i + 1]!;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const j = i === 0 && s === 0 ? 0 : amt;
      pts.push([x0 + (x1 - x0) * t + (rng() * 2 - 1) * j, y0 + (y1 - y0) * t + (rng() * 2 - 1) * j]);
    }
  }
  pts.push(points[points.length - 1]!);
  return smooth(pts);
}

/** Closed wobbly polygon (straight-ish sides). */
export function shakyPoly(points: Pt[], rng: Rng, amt = 0.4): string {
  return `${shaky([...points, points[0]!], rng, amt, 2)}Z`;
}

/* ---------- shared defs (patterns, crayon roughening) ---------- */

export interface Ids {
  gold: string;
  goldDark: string;
  rough: string;
  sky: string;
}

/** Defs referenced from all the small SVGs in the scene (ids are document-wide). */
export function SharedDefs({ ids }: { ids: Ids }) {
  return (
    <svg className="cr-defs" width="0" height="0" focusable="false">
      <defs>
        <pattern id={ids.gold} width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
          <rect width="2.4" height="2.4" fill="#f4c642" />
          <path d="M0 0V2.4" stroke="#e39a22" strokeWidth="0.75" opacity="0.7" />
        </pattern>
        <pattern id={ids.goldDark} width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <rect width="2.2" height="2.2" fill="#dc9328" />
          <path d="M0 0V2.2" stroke="#b86a14" strokeWidth="0.7" opacity="0.75" />
        </pattern>
        <pattern id={ids.sky} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
          <path d="M0 0V3.2" stroke="#ffffff" strokeWidth="0.9" opacity="0.045" />
        </pattern>
        <filter id={ids.rough} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="5" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

/* ---------- coins ---------- */

export const SYMBOLS = ['NGTM', 'CEDR', 'WAXX', 'CRYN'] as const;
export type Sym = (typeof SYMBOLS)[number];

/** One face-on coin path set per symbol, so every copy of a coin wobbles the same way. */
const COIN_ART = Object.fromEntries(
  SYMBOLS.map((s, i) => {
    const rng = createRng(100 + i * 7);
    return [
      s,
      {
        rim: blob(0.9, 0.9, 10.2, 10.2, rng, 0.03, 0),
        edge: blob(0, 0, 10, 10, rng, 0.035),
        ring: blob(0, 0, 7.3, 7.3, rng, 0.04, 0.5),
      },
    ];
  }),
) as Record<Sym, { rim: string; edge: string; ring: string }>;

/** A chunky gold coin seen face-on, with a made-up ticker. viewBox -12..12. */
export function CoinFace({ sym, ids }: { sym: Sym; ids: Ids }) {
  const a = COIN_ART[sym];
  return (
    <svg viewBox="-12 -12 24 24" focusable="false">
      <g filter={`url(#${ids.rough})`}>
        <path d={a.rim} className="cr-coin-rim" />
        <path d={a.edge} fill={`url(#${ids.gold})`} className="cr-coin-edge" />
        <path d={a.ring} className="cr-coin-ring" />
        <text y="1.9" textAnchor="middle" className="cr-coin-sym">
          {sym}
        </text>
        <path d="M-7.2 -3.6Q-6.2 -6.6 -3.2 -7.6" className="cr-coin-shine" />
      </g>
    </svg>
  );
}

/** Side view of a coin lying flat: top ellipse + thickness. Centre (0,0) is the top face. */
export function stackCoin(x: number, y: number, rng: Rng, rx = 11.5, ry = 3.8, th = 3.6) {
  const band = `M${f(x - rx)} ${f(y)}L${f(x - rx)} ${f(y + th)}A${rx} ${ry} 0 0 0 ${f(x + rx)} ${f(y + th)}L${f(x + rx)} ${f(y)}Z`;
  const ridges = Array.from({ length: 6 }, (_, i) => {
    const t = -0.8 + (i / 5) * 1.6;
    const bx = x + t * rx;
    const by = y + ry * Math.sqrt(1 - t * t);
    return `M${f(bx)} ${f(by + 0.4)}V${f(by + th - 0.2)}`;
  }).join('');
  return { band, ridges, top: blob(x, y, rx, ry, rng, 0.04, 0.25) };
}

export function StackCoinSvg({ ids }: { ids: Ids }) {
  const rng = createRng(77);
  const c = stackCoin(13, 5, rng);
  return (
    <svg viewBox="0 0 26 13" focusable="false">
      <g filter={`url(#${ids.rough})`}>
        <path d={c.band} fill={`url(#${ids.goldDark})`} className="cr-stack-band" />
        <path d={c.ridges} className="cr-stack-ridge" />
        <path d={c.top} fill={`url(#${ids.gold})`} className="cr-stack-top" />
      </g>
    </svg>
  );
}

/* ---------- blockchain ---------- */

export const BLOCK_COLORS = ['#86b6ff', '#c9a2f2', '#93d9a0', '#ffb877', '#f59595'];

const BLOCK_ART = (() => {
  const rng = createRng(31);
  return {
    front: shakyPoly([[1, 10], [19, 10], [19, 28], [1, 28]], rng, 0.35),
    top: shakyPoly([[1, 10], [7, 3.5], [25, 3.5], [19, 10]], rng, 0.3),
    side: shakyPoly([[19, 10], [25, 3.5], [25, 21.5], [19, 28]], rng, 0.3),
    linkA: blob(-6.5, 17, 3.4, 2.1, rng, 0.06, 0.3),
    linkB: blob(-1.8, 17, 3.4, 2.1, rng, 0.06, 0.3),
  };
})();

/** A crayon cube with its chain link hanging off the left side. viewBox x -11..26. */
export function Block({ n, color, ids }: { n: number; color: string; ids: Ids }) {
  const a = BLOCK_ART;
  return (
    <svg viewBox="-11 0 37 30" focusable="false" style={{ color }}>
      <g filter={`url(#${ids.rough})`}>
        <path d={a.linkA + a.linkB} className="cr-link" />
        <path d={a.side} className="cr-block-side" />
        <path d={a.top} className="cr-block-top" />
        <path d={a.front} className="cr-block-front" />
        <text x="10" y="21.5" textAnchor="middle" className="cr-block-label">
          #{n}
        </text>
      </g>
    </svg>
  );
}

export function CheckBadge({ ids }: { ids: Ids }) {
  const rng = createRng(9);
  return (
    <svg viewBox="-7 -7 14 14" focusable="false">
      <g filter={`url(#${ids.rough})`}>
        <path d={blob(0, 0, 5.6, 5.6, rng, 0.05)} className="cr-check-bg" />
        <path d="M-2.8 0.2L-0.8 2.5L3 -2.6" className="cr-check" />
      </g>
    </svg>
  );
}

/* ---------- rocket ---------- */

const ROCKET = (() => {
  const rng = createRng(55);
  return {
    body: `${shaky([[10, 1.5], [15.6, 9], [16.4, 20], [15.6, 34], [4.4, 34], [3.6, 20], [4.4, 9], [10, 1.5]], rng, 0.25, 2)}Z`,
    nose: `${shaky([[10, 1.5], [14.6, 7.8], [10, 9.2], [5.4, 7.8], [10, 1.5]], rng, 0.15, 2)}Z`,
    window: blob(10, 17.5, 3.4, 3.4, rng, 0.05),
    finL: shakyPoly([[4.6, 24], [0.3, 33], [0.8, 38], [4.4, 33.5]], rng, 0.2),
    finR: shakyPoly([[15.4, 24], [19.7, 33], [19.2, 38], [15.6, 33.5]], rng, 0.2),
    nozzle: shakyPoly([[6.6, 34], [13.4, 34], [12.6, 37.5], [7.4, 37.5]], rng, 0.15),
    stripe: shaky([[4.3, 27.5], [15.7, 27.5]], rng, 0.2, 3),
  };
})();

export function Rocket({ ids }: { ids: Ids }) {
  const r = ROCKET;
  return (
    <svg viewBox="0 0 20 46" focusable="false">
      <g filter={`url(#${ids.rough})`}>
        <path d={r.finL} className="cr-rk-fin" />
        <path d={r.finR} className="cr-rk-fin" />
        <path d={r.nozzle} className="cr-rk-nozzle" />
        <path d={r.body} className="cr-rk-body" />
        <path d={r.nose} className="cr-rk-nose" />
        <path d={r.stripe} className="cr-rk-stripe" />
        <path d={r.window} className="cr-rk-window" />
        <path d="M8.2 16.2q.8-1.2 2.2-1.3" className="cr-rk-glint" />
      </g>
    </svg>
  );
}

export function Flame() {
  return (
    <svg viewBox="0 0 10 14" focusable="false">
      <path d="M1 0C0 4 2 9 5 14C8 9 10 4 9 0Q5 2 1 0Z" className="cr-flame-out" />
      <path d="M3 0C2.6 3 3.6 6.5 5 9.5C6.4 6.5 7.4 3 7 0Q5 1.2 3 0Z" className="cr-flame-in" />
    </svg>
  );
}

export function Puff({ ids, seed }: { ids: Ids; seed: number }) {
  const rng = createRng(seed);
  return (
    <svg viewBox="-6 -6 12 12" focusable="false">
      <path d={blob(0, 0, 5, 4.4, rng, 0.12, 0.2)} className="cr-puff-shape" filter={`url(#${ids.rough})`} />
    </svg>
  );
}

export function Star({ big = false }: { big?: boolean }) {
  const r = big ? 4 : 3;
  return (
    <svg viewBox="-5 -5 10 10" focusable="false">
      <path
        d={`M0 ${-r}L${r * 0.28} ${-r * 0.28}L${r} 0L${r * 0.28} ${r * 0.28}L0 ${r}L${-r * 0.28} ${r * 0.28}L${-r} 0L${-r * 0.28} ${-r * 0.28}Z`}
        className="cr-star"
      />
    </svg>
  );
}

/* ---------- wallet ---------- */

const WALLET = (() => {
  const rng = createRng(64);
  return {
    body: shakyPoly([[2, 6], [94, 4], [95, 50], [3, 51]], rng, 0.5),
    stitch: shakyPoly([[6, 10], [90, 8.5], [91, 46.5], [7, 47]], rng, 0.35),
    flap: `${shaky([[58, 5], [96, 3.5], [97, 30], [60, 31], [56, 18], [58, 5]], rng, 0.35, 2)}Z`,
    button: blob(66, 18, 3.2, 3.2, rng, 0.05),
    slot: shaky([[10, 6], [52, 5.2]], rng, 0.3, 3),
  };
})();

const SLIP = (() => {
  const rng = createRng(12);
  return {
    paper: shakyPoly([[1, 2], [81, 0.6], [82, 62], [2, 63]], rng, 0.45),
    lines: [22, 40].map((y) => shaky([[5, y], [77, y - 0.6]], rng, 0.25, 3)).join(''),
    under: shaky([[7, 15], [46, 14.2]], rng, 0.3, 3),
  };
})();

export function WalletFront({ ids }: { ids: Ids }) {
  const w = WALLET;
  return (
    <svg viewBox="0 0 98 54" focusable="false">
      <g filter={`url(#${ids.rough})`}>
        <path d={w.body} className="cr-wallet-body" />
        <path d={w.stitch} className="cr-wallet-stitch" />
        <path d={w.slot} className="cr-wallet-slot" />
        <path d={w.flap} className="cr-wallet-flap" />
        <path d={w.button} className="cr-wallet-button" />
      </g>
    </svg>
  );
}

export function SlipPaper({ ids }: { ids: Ids }) {
  const s = SLIP;
  return (
    <svg viewBox="0 0 83 64" preserveAspectRatio="none" focusable="false" className="cr-slip__paper">
      <g filter={`url(#${ids.rough})`}>
        <path d={s.paper} className="cr-slip-paper" />
        <path d={s.lines} className="cr-slip-lines" />
        <path d={s.under} className="cr-slip-under" />
      </g>
    </svg>
  );
}

/* ---------- the still backdrop: sky, moon, ground, coin towers, launch pad ---------- */

export const TOWERS = [
  { x: 22, n: 6 },
  { x: 47, n: 9 },
  { x: 72, n: 4 },
];
export const GROUND_Y = 177;
export const COIN_TH = 3.6;

export const STARS: { x: number; y: number; big?: boolean }[] = [
  { x: 18, y: 54 },
  { x: 62, y: 70, big: true },
  { x: 104, y: 48 },
  { x: 198, y: 52 },
  { x: 244, y: 70 },
  { x: 312, y: 66 },
  { x: 260, y: 14 },
  { x: 120, y: 132 },
  { x: 9, y: 112 },
  { x: 92, y: 98 },
  { x: 214, y: 100, big: true },
];

const BACKDROP = (() => {
  const rng = createRng(2026);
  const towers = TOWERS.map((t, ti) => {
    const coins = [];
    // the top coin of the middle tower is a separate element (it hops)
    const n = ti === 1 ? t.n - 1 : t.n;
    for (let k = 0; k < n; k++) {
      const x = t.x + (rng() * 2 - 1) * 1.1;
      const y = GROUND_Y - 4 - k * COIN_TH;
      coins.push(stackCoin(x, y, rng));
    }
    return coins;
  });
  return {
    moon: blob(284, 34, 18, 18, rng, 0.025, 0.25),
    moonShade: `${shaky([[284, 16.5], [292, 22], [295.5, 34], [291, 46], [284, 51.5]], rng, 0.3, 2)}Q302 34 284 16.5Z`,
    craters: [
      blob(277, 28, 3.4, 3, rng, 0.08),
      blob(286, 42, 2.4, 2.1, rng, 0.08),
      blob(274.5, 40, 1.6, 1.5, rng, 0.1),
    ].join(''),
    ground: `${shaky([[-4, GROUND_Y + 1], [60, GROUND_Y - 1], [140, GROUND_Y + 1.5], [220, GROUND_Y - 0.5], [324, GROUND_Y + 1]], rng, 0.6, 4)}L324 204L-4 204Z`,
    groundEdge: shaky([[-4, GROUND_Y + 1], [60, GROUND_Y - 1], [140, GROUND_Y + 1.5], [220, GROUND_Y - 0.5], [324, GROUND_Y + 1]], rng, 0.6, 4),
    groundHatch: Array.from({ length: 26 }, (_, i) => {
      const x = 4 + i * 12.4 + rng() * 4;
      const y = GROUND_Y + 7 + rng() * 12;
      return `M${f(x)} ${f(y)}l${f(5 + rng() * 4)} ${f(-1.5 - rng())}`;
    }).join(''),
    towers,
    pad: shakyPoly([[184, 176.5], [208, 176.5], [205, 172.5], [187, 172.5]], rng, 0.25),
    padLegs: shaky([[189, 176.5], [188, 180]], rng, 0.1, 2) + shaky([[203, 176.5], [204, 180]], rng, 0.1, 2),
    motion: [
      shaky([[109, 86], [105, 96], [109, 106]], rng, 0.3, 2),
      shaky([[103, 90], [101, 96], [103, 102]], rng, 0.3, 2),
      shaky([[187, 86], [191, 96], [187, 106]], rng, 0.3, 2),
      shaky([[193, 90], [195, 96], [193, 102]], rng, 0.3, 2),
    ].join(''),
    sparkles: 'M117 62l3 5M146 52v6M176 62l-3 5',
    piggy: {
      legs: [130, 138, 154, 162]
        .map((x) => shakyPoly([[x - 3, 168], [x + 3, 168], [x + 2.6, 178], [x - 2.6, 178]], rng, 0.2))
        .join(''),
      body: blob(146, 158, 26, 16.5, rng, 0.03, 0.2),
      earL: shakyPoly([[137, 145.5], [139, 137], [145, 143.5]], rng, 0.2),
      earR: shakyPoly([[151, 143.2], [157, 137.5], [158, 146]], rng, 0.2),
      snout: blob(172, 158.5, 4.6, 6, rng, 0.05),
      nostrils: 'M171 156.4v1.4M173.6 156.6v1.4',
      eye: blob(161, 151.5, 1.2, 1.5, rng, 0.05, 0),
      cheek: blob(160, 160, 3.4, 2.3, rng, 0.08),
      tail: shaky([[120.5, 155], [116, 153], [115.5, 149.5], [118.5, 149], [118.5, 152], [114, 154]], rng, 0.15, 2),
      slot: shaky([[139, 142.2], [153, 141.8]], rng, 0.2, 3),
      shine: 'M128 150Q131 145 137 144',
    },
  };
})();

/** The backdrop's still stars and dots, each kind joined into one path (they don't overlap). */
const sparkle = (x: number, y: number, r: number, k: number) =>
  `M${x} ${y - r}L${x + k} ${y - k}L${x + r} ${y}L${x + k} ${y + k}` +
  `L${x} ${y + r}L${x - k} ${y + k}L${x - r} ${y}L${x - k} ${y - k}Z`;
const dot = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const STILL_STARS = STARS.slice(6)
  .map((s) => (s.big ? sparkle(s.x, s.y, 4, 1.1) : sparkle(s.x, s.y, 3, 0.8)))
  .join('');
const DOTS = [
  [40, 30],
  [150, 24],
  [228, 42],
  [302, 92],
  [168, 40],
  [80, 42],
  [138, 120],
  [30, 140],
]
  .map(([x, y]) => dot(x!, y!, 0.9))
  .join('');

export function Backdrop({ ids }: { ids: Ids }) {
  const b = BACKDROP;
  return (
    <svg className="cr-backdrop" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" focusable="false">
      <rect width="320" height="200" fill={`url(#${ids.sky})`} />
      <g filter={`url(#${ids.rough})`}>
        <path d={STILL_STARS} className="cr-star" />
        <path d={DOTS} className="cr-dot" />

        <path d={b.moon} className="cr-moon" />
        <path d={b.moonShade} className="cr-moon-shade" />
        <path d={b.craters} className="cr-moon-crater" />
        <path d="M280 37q2 1.6 4.5 0" className="cr-moon-smile" />
        <path d={dot(279.5, 33, 0.9) + dot(286, 32.6, 0.9)} className="cr-moon-eye" />

        <path d={b.motion} className="cr-motion" />
        <path d={b.sparkles} className="cr-motion" />

        <path d={b.ground} className="cr-ground" />
        <path d={b.groundHatch} className="cr-ground-hatch" />
        <path d={b.groundEdge} className="cr-ground-edge" />

        {b.towers.map((coins, ti) => (
          <g key={ti}>
            {coins.map((c, k) => (
              <g key={k}>
                <path d={c.band} fill={`url(#${ids.goldDark})`} className="cr-stack-band" />
                <path d={c.ridges} className="cr-stack-ridge" />
                <path d={c.top} fill={`url(#${ids.gold})`} className="cr-stack-top" />
              </g>
            ))}
          </g>
        ))}

        <path d={b.piggy.legs} className="cr-pig" />
        <path d={b.piggy.tail} className="cr-pig-tail" />
        <path d={b.piggy.earL} className="cr-pig" />
        <path d={b.piggy.body} className="cr-pig" />
        <path d={b.piggy.earR} className="cr-pig cr-pig-ear" />
        <path d={b.piggy.slot} className="cr-pig-slot" />
        <path d={b.piggy.shine} className="cr-pig-shine" />
        <path d={b.piggy.cheek} className="cr-pig-cheek" />
        <path d={b.piggy.snout} className="cr-pig cr-pig-snout" />
        <path d={b.piggy.nostrils} className="cr-pig-line" />
        <path d={b.piggy.eye} className="cr-pig-eye" />

        <path d={b.padLegs} className="cr-pad-leg" />
        <path d={b.pad} className="cr-pad" />
      </g>
    </svg>
  );
}
