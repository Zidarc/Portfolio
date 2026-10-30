/**
 * Pixel art for Pixel Town. Everything is drawn on an 80 x 50 grid of "pixels" (one pixel = 4 sheet
 * units), built from little row-strings and merged into as few rects as possible.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
}

const INK = '#1d1b2a';

/** Rows of characters → rects (runs of one colour along a row become one rect). '.' is see-through. */
export function sprite(rows: string[], palette: Record<string, string>, x0 = 0, y0 = 0, px = 1): Rect[] {
  const out: Rect[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x]!;
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const c = palette[ch];
      if (c) out.push({ x: x0 + x * px, y: y0 + y * px, w: (end - x) * px, h: px, c });
      x = end;
    }
  });
  return out;
}

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Rects → one path per colour where that keeps the stacking: a rect joins an earlier path of its colour
 * unless something painted after that path overlaps it. The town was ~670 separate elements to lay out.
 */
function merge(rects: Rect[]): { c: string; d: string }[] {
  const groups: { c: string; rects: Rect[] }[] = [];
  for (const r of rects) {
    let target: (typeof groups)[number] | undefined;
    for (let k = groups.length - 1; k >= 0; k--) {
      const g = groups[k]!;
      if (g.c === r.c) {
        target = g;
        break;
      }
      if (g.rects.some((o) => overlaps(o, r))) break;
    }
    if (target) target.rects.push(r);
    else groups.push({ c: r.c, rects: [r] });
  }
  return groups.map((g) => ({ c: g.c, d: g.rects.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}z`).join('') }));
}

const merged = new WeakMap<Rect[], { c: string; d: string }[]>();

export function Rects({ rects }: { rects: Rect[] }) {
  let paths = merged.get(rects);
  if (!paths) merged.set(rects, (paths = merge(rects)));
  return (
    <>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.c} />
      ))}
    </>
  );
}

/* ---------- a 3 x 5 arcade font ---------- */

const GLYPHS: Record<string, string[]> = {
  S: ['###', '#..', '###', '..#', '###'],
  C: ['###', '#..', '#..', '#..', '###'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  E: ['###', '#..', '##.', '#..', '###'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  0: ['###', '#.#', '#.#', '#.#', '###'],
  2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'],
  4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '##.', '..#', '##.'],
};

/** Arcade lettering with a dark drop shadow; each letter is 3 x 5 font pixels, 4 apart. */
export function text(str: string, x: number, y: number, px: number, color: string): Rect[] {
  const shadow: Rect[] = [];
  const face: Rect[] = [];
  [...str].forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) return;
    shadow.push(...sprite(g, { '#': INK }, x + i * 4 * px + px, y + px, px));
    face.push(...sprite(g, { '#': color }, x + i * 4 * px, y, px));
  });
  return [...shadow, ...face];
}

/* ---------- town pieces ---------- */

const GROUND = 34;

function house(x: number, w: number, h: number, wall: string, roof: string, roofTop: string): Rect[] {
  const top = GROUND - h;
  const out: Rect[] = [
    { x: x - 0.5, y: top - 0.5, w: w + 1, h: h + 0.5, c: INK },
    { x, y: top, w, h, c: wall },
  ];
  // a stepped roof: dark rows first, then the coloured rows over them leave a 1/2-pixel outline
  const rows: Rect[] = [];
  for (let i = 0; ; i++) {
    const rw = w + 2 - 2 * i;
    if (rw <= 0) break;
    rows.push({ x: x - 1 + i, y: top - 1 - i, w: rw, h: 1, c: rw <= 2 ? roofTop : roof });
  }
  out.push(...rows.map((r) => ({ ...r, x: r.x - 0.5, y: r.y - 0.5, w: r.w + 1, c: INK })), ...rows);
  const door = x + Math.floor(w / 2) - 1;
  out.push(
    { x: door - 0.5, y: GROUND - 4.5, w: 3, h: 4.5, c: INK },
    { x: door, y: GROUND - 4, w: 2, h: 4, c: '#8a5530' },
    { x: door + 1.4, y: GROUND - 2.2, w: 0.4, h: 0.4, c: '#f2c94c' },
  );
  for (const wx of [x + 1.5, x + w - 3.5]) {
    out.push({ x: wx - 0.25, y: top + 1.75, w: 2.5, h: 2.5, c: INK }, { x: wx, y: top + 2, w: 2, h: 2, c: '#ffe36e' });
  }
  return out;
}

function tree(x: number): Rect[] {
  const canopy = sprite(
    ['..GGG..', '.GGLGG.', 'GGLLGGG', 'GGGGLGG', 'GGGGGGG', '.DGGGD.', '..DDD..'],
    { G: '#2f8f3a', L: '#5cc451', D: '#25702e' },
    x,
    GROUND - 10,
  );
  return [{ x: x + 2.75, y: GROUND - 3.5, w: 1.5, h: 3.5, c: '#7a4a2a' }, ...canopy];
}

function shop(x: number, w: number, h: number): Rect[] {
  const top = GROUND - h;
  const out: Rect[] = [
    { x: x - 0.5, y: top - 1.5, w: w + 1, h: h + 1.5, c: INK },
    { x, y: top - 1, w, h: h + 1, c: '#f6b8cf' },
  ];
  // striped awning with a scalloped edge
  for (let i = 0; i < w; i += 2) {
    const c = (i / 2) % 2 === 0 ? '#d6453d' : '#fff8f0';
    out.push({ x: x + i, y: top + 1, w: 2, h: 2, c }, { x: x + i + 0.5, y: top + 3, w: 1, h: 0.75, c });
  }
  out.push(
    { x: x + 1.25, y: GROUND - 6.25, w: 5.5, h: 4.5, c: INK },
    { x: x + 1.5, y: GROUND - 6, w: 5, h: 4, c: '#bfe7f7' },
    { x: x + 1.5, y: GROUND - 6, w: 1.5, h: 1.5, c: '#eaf8ff' },
    { x: x + w - 5.5, y: GROUND - 5.5, w: 3, h: 5.5, c: INK },
    { x: x + w - 5, y: GROUND - 5, w: 2, h: 5, c: '#8a5530' },
    // the sign
    { x: x + 2.5, y: top - 5, w: 9, h: 3.5, c: INK },
    { x: x + 2.75, y: top - 4.75, w: 8.5, h: 3, c: '#8a5530' },
  );
  out.push(...text('SHOP', x + 3.25, top - 4.4, 0.45, '#ffe36e'));
  return out;
}

function hills(): Rect[] {
  const out: Rect[] = [];
  let start = 0;
  let prev = -1;
  const height = (x: number) => Math.round(5 + 2.6 * Math.sin(x / 6.5) + 1.6 * Math.sin(x / 2.9 + 1));
  for (let x = 0; x <= 80; x++) {
    const h = x < 80 ? height(x) : -1;
    if (h !== prev) {
      if (prev > 0) out.push({ x: start, y: GROUND - prev, w: x - start, h: prev, c: '#6cbf5c' });
      start = x;
      prev = h;
    }
  }
  return out;
}

const PEBBLES: [number, number][] = [
  [5, 39.5],
  [17, 41],
  [29, 39],
  [41, 41.5],
  [53, 39.5],
  [64, 41],
  [75, 40],
];
const TUFTS: [number, number][] = [
  [3, 45],
  [12, 47],
  [24, 44.5],
  [47, 46.5],
  [58, 44],
  [70, 47],
  [77, 44.5],
];

export const TOWN: Rect[] = [
  { x: 0, y: 0, w: 80, h: 14, c: '#58b8f0' },
  { x: 0, y: 14, w: 80, h: 8, c: '#79c9f2' },
  { x: 0, y: 22, w: 80, h: 12, c: '#a3dcf6' },
  ...sprite(['.YYYY.', 'YYWWYY', 'YWWWYY', 'YWWYYY', 'YYYYYY', '.YYYY.'], { Y: '#ffd84a', W: '#fff1a8' }, 45, 3),
  ...hills(),
  { x: 0, y: GROUND, w: 80, h: 4, c: '#58b847' },
  { x: 0, y: GROUND, w: 80, h: 0.75, c: '#7ad35f' },
  { x: 0, y: 38, w: 80, h: 5, c: '#d9b27a' },
  { x: 0, y: 38, w: 80, h: 0.5, c: '#b98d55' },
  { x: 0, y: 43, w: 80, h: 7, c: '#4aa13f' },
  { x: 0, y: 43, w: 80, h: 0.5, c: '#3d8a34' },
  ...PEBBLES.map(([x, y]) => ({ x, y, w: 1, h: 0.5, c: '#b98d55' })),
  ...TUFTS.flatMap(([x, y]) => [
    { x, y, w: 0.5, h: 1, c: '#6cc456' },
    { x: x + 1, y: y - 0.5, w: 0.5, h: 1.5, c: '#6cc456' },
  ]),
  ...house(3, 12, 9, '#f2d08a', '#d6453d', '#f07a6e'),
  { x: 11, y: 16, w: 2, h: 4, c: INK },
  { x: 11.5, y: 16.5, w: 1, h: 3.5, c: '#a0522d' },
  ...house(18, 10, 11, '#cfe0f0', '#3a6fc4', '#6f9be0'),
  ...tree(30),
  { x: 39.25, y: 26, w: 0.75, h: 8, c: INK },
  { x: 38.5, y: 24.5, w: 2.25, h: 2, c: INK },
  { x: 38.75, y: 24.75, w: 1.75, h: 1.5, c: '#ffe36e' },
  ...shop(42, 14, 10),
  ...tree(58),
  ...house(67, 11, 8, '#e7c3a0', '#7b52ab', '#a98bd1'),
  // HUD: score (the tens digit is a separate, rolling layer) and three lives
  ...text('SCORE 0004', 2, 2, 0.5, '#ffffff'),
  ...text('0', 24, 2, 0.5, '#ffffff'),
  ...[28, 31.5, 35].flatMap((x) => [
    ...sprite(['.#.#.', '#####', '.###.', '..#..'], { '#': INK }, x + 0.5, 2.75, 0.5),
    ...sprite(['.#.#.', '#####', '.###.', '..#..'], { '#': '#ff4d6d' }, x, 2.25, 0.5),
  ]),
];

/* ---------- sprites for the moving layers ---------- */

const HERO_PALETTE = { K: INK, R: '#d6453d', S: '#f2c29b', B: '#3a6fc4', N: '#5b3a1e', W: '#ffffff' };
export const HERO_A = sprite(
  ['..RRRR..', '..RRRRRR', '..SSKS..', '..SSSS..', '.BBBBBB.', 'S.BBBB.S', '..BBBB..', '..N..N..', '.NN..NN.'],
  HERO_PALETTE,
);
export const HERO_B = sprite(
  ['..RRRR..', '..RRRRRR', '..SSKS..', '..SSSS..', '.BBBBBB.', '.SBBBBS.', '..BBBB..', '...NN...', '...NNN..'],
  HERO_PALETTE,
);
export const COIN = sprite(['.KKK.', 'KYWYK', 'KYWYK', 'KYYOK', '.KKK.'], {
  K: '#8a5a0c',
  Y: '#f2c94c',
  W: '#fff6c2',
  O: '#c98b16',
});
export const CLOUD = sprite(['...WWW....', '.WWWWWWW..', 'WWWWWWWWWW', '.GGGGGGGG.'], { W: '#ffffff', G: '#dcefff' });
export const TENS = [2, 3, 4, 5].flatMap((d, i) => text(String(d), 0, i * 3, 0.5, '#ffffff'));
export const PRESS_START = text('PRESS START', 0, 0, 0.5, '#ffffff');
