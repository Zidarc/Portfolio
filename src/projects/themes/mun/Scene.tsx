import { memo, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ThemeSceneProps } from '../../theme.ts';
import { blob, box, pen, star, wob, type Pt } from './draw.ts';
import './mun.css';

/*
 * The Grand Debate '26: a kid's crayon drawing of a committee room.
 * One 320 x 200 coordinate system. The still parts are two SVGs drawn once (room, then desks in
 * front); every moving part is a small absolutely positioned "piece" with its own SVG that shows the
 * same coordinates, so it can be moved with CSS transforms alone (composited, never repainted).
 */

const W = 320;
const H = 200;
const FLOOR = 98;

/* ---------- colours (crayon tokens as literals so SVG patterns can use them) ---------- */

const C = {
  ink: '#3a3836',
  blue: '#3a6fc4',
  red: '#d6453d',
  green: '#3f9a4f',
  yellow: '#e8b931',
  orange: '#ea7a2c',
  purple: '#7b52ab',
  sky: '#86b4e8',
  pink: '#e48aa8',
  wood: '#a8703f',
  woodLight: '#d7a86e',
  paper: '#fffbf1',
};
type Hatch = 'blue' | 'red' | 'green' | 'yellow' | 'orange' | 'purple' | 'sky' | 'pink' | 'wood' | 'woodLight';
const HATCHES: Hatch[] = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'sky', 'pink', 'wood', 'woodLight'];
type Fill = (h: Hatch) => string;

/* ---------- pieces: little composited windows onto the shared coordinates ---------- */

type Box = readonly [x: number, y: number, w: number, h: number];
const pc = (n: number) => `${Math.round(n * 1000) / 1000}%`;
/** transform-origin for a piece, given a point in scene coordinates */
const originOf = ([x, y, w, h]: Box, ox: number, oy: number) => `${pc(((ox - x) / w) * 100)} ${pc(((oy - y) / h) * 100)}`;

function Piece({ at, className, style, children }: { at: Box; className: string; style?: CSSProperties; children: ReactNode }) {
  const [x, y, w, h] = at;
  return (
    <div
      className={`mun-piece ${className}`}
      style={{ left: pc((x / W) * 100), top: pc((y / H) * 100), width: pc((w / W) * 100), height: pc((h / H) * 100), ...style }}
    >
      <svg viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="none" focusable="false">
        {children}
      </svg>
    </div>
  );
}

/** A crayon outline: the line plus a faint second pass slightly off, like wax going over twice. */
function Ink({ d, color, width, halo = true }: { d: string; color?: string; width?: number; halo?: boolean }) {
  const style = { stroke: color, strokeWidth: width } as CSSProperties;
  return (
    <>
      {halo && <path d={d} className="mun-ink mun-halo" style={style} transform="translate(0.5 0.45)" />}
      <path d={d} className="mun-ink" style={style} />
    </>
  );
}

/** Coloured-in shape: hatch fill + outline. */
function Shape({ d, fill, color, width }: { d: string; fill: string; color?: string; width?: number }) {
  return (
    <>
      <path d={d} fill={fill} />
      <Ink d={d} color={color} width={width} />
    </>
  );
}

/* ---------- the room ---------- */

const ROOM = {
  wallLine: wob([[-2, FLOOR], [322, FLOOR]], 0.6),
  rail: wob([[-2, 84], [322, 84]], 0.5),
  planks: [108, 121, 137, 156, 178].map((y, i) => wob([[-2, y + (i % 2)], [322, y - (i % 2)]], 0.7)).join(''),
  seams: Array.from({ length: 14 }, (_, i) => {
    const row = i % 5;
    const ys = [98, 108, 121, 137, 156, 178, 200];
    const x = 14 + ((i * 83) % 300);
    return wob([[x, ys[row]! + 1], [x - 1.5, ys[row + 1]! - 1]], 0.3);
  }).join(''),
  banner: wob(
    [
      [100, 6],
      [130, 4.5],
      [160, 6],
      [190, 4.5],
      [220, 6],
      [221, 21],
      [190, 19.5],
      [160, 21],
      [130, 19.5],
      [99, 21],
    ],
    0.3,
    true,
  ),
  tailL: wob([[100, 9], [88, 9], [93, 15], [88, 23], [100, 23]], 0.25, true),
  tailR: wob([[220, 9], [232, 9], [227, 15], [232, 23], [220, 23]], 0.25, true),
  bannerString: wob([[60, 0], [100, 8]], 0.2) + wob([[220, 8], [260, 0]], 0.2),
};

const POLES = [12, 32, 52, 250, 270, 290];
const POLE_TOP = 28;
// repeated pieces that share a style are one path each (they don't overlap, so they look the same):
// separate elements were most of what the scene cost to lay out
const poleLines = POLES.map((x) => wob([[x, POLE_TOP], [x + 0.4, FLOOR + 2]], 0.25)).join('');
const poleFeet = POLES.map((x) => wob([[x - 5, FLOOR + 2.5], [x + 5, FLOOR + 2]], 0.3)).join('');
/** A circle as path data, so several can share one path. */
const dot = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const poleKnobs = POLES.map((x) => dot(x + 0.1, POLE_TOP - 1, 1.7)).join('');

/* made-up flags, nothing real: star, sunset split, sun, cloud, zigzag, polka dots */
const FLAG_W = 17;
const FLAG_H = 11.5;
const flagCloth = (x: number) => {
  const x0 = x + 0.8;
  const y0 = POLE_TOP + 1.5;
  const r = x0 + FLAG_W;
  return `M${x0} ${y0}Q${x0 + FLAG_W * 0.3} ${y0 - 1.6} ${x0 + FLAG_W * 0.55} ${y0 + 0.2}T${r} ${y0 + 0.6}L${r} ${y0 + FLAG_H + 0.6}Q${x0 + FLAG_W * 0.7} ${y0 + FLAG_H + 2.2} ${x0 + FLAG_W * 0.45} ${y0 + FLAG_H + 0.2}T${x0} ${y0 + FLAG_H}Z`;
};
const FLAGS: { base: Hatch; art: (x: number, y: number) => ReactNode }[] = [
  { base: 'purple', art: (x, y) => <path d={star(x + 8.5, y + 5.8, 4.3)} fill={C.yellow} stroke={C.orange} strokeWidth={0.5} /> },
  {
    base: 'yellow',
    art: (x, y) => <path d={`M${x + FLAG_W} ${y - 0.6}L${x + FLAG_W} ${y + FLAG_H + 0.6}L${x + 1} ${y + FLAG_H}Z`} fill={C.red} opacity={0.75} />,
  },
  {
    base: 'green',
    art: (x, y) => (
      <g stroke={C.yellow} strokeWidth={0.9} strokeLinecap="round">
        <circle cx={x + 8.5} cy={y + 5.8} r={2.6} fill={C.yellow} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <path key={i} d={`M${x + 8.5 + Math.cos(a) * 3.8} ${y + 5.8 + Math.sin(a) * 3.8}l${Math.cos(a) * 1.5} ${Math.sin(a) * 1.5}`} />;
        })}
      </g>
    ),
  },
  { base: 'sky', art: (x, y) => <path d={blob(x + 8.5, y + 6, 5, 2.6, 0.18, 7)} fill={C.paper} stroke={C.ink} strokeWidth={0.4} /> },
  {
    base: 'orange',
    art: (x, y) => (
      <path
        d={`M${x + 0.5} ${y + 6.5}l2.8 -3 2.8 3 2.8 -3 2.8 3 2.8 -3 2.8 3`}
        fill="none"
        stroke={C.purple}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    ),
  },
  {
    base: 'red',
    art: (x, y) => (
      <g fill={C.paper}>
        <circle cx={x + 4.5} cy={y + 3.6} r={1.5} />
        <circle cx={x + 11.5} cy={y + 4.4} r={1.5} />
        <circle cx={x + 7.8} cy={y + 8.4} r={1.5} />
        <circle cx={x + 14.5} cy={y + 9} r={1.2} />
      </g>
    ),
  },
];
const FLAG_INK = POLES.map((x) => flagCloth(x));

/* ---------- the dais: chair's table, two chairs, gavel ---------- */

const DAIS = {
  top: box(113, 59.5, 229, 64, 0.3),
  cloth: wob(
    [
      [116, 64],
      [226, 64],
      [227, 98],
      [116, 98.5],
    ],
    0.4,
    true,
  ),
  folds: [136, 157, 186, 207].map((x) => wob([[x, 66], [x + 0.5, 97]], 0.5)).join(''),
  block: box(204, 56.6, 220, 59.8, 0.2),
};

interface Person {
  x: number;
  y: number;
  shirt: Hatch;
  skin: string;
  hair: string;
  style: 0 | 1 | 2 | 3;
  asleep?: boolean;
}

/** torso from y (shoulders) down to bottom, then head on top */
function personPaths(p: Person, bottom: number) {
  const { x, y } = p;
  const torso = wob(
    [
      [x - 9.5, bottom],
      [x - 8.6, y + 3.5],
      [x - 6, y + 0.4],
      [x, y - 0.6],
      [x + 6, y + 0.4],
      [x + 8.6, y + 3.5],
      [x + 9.5, bottom],
    ],
    0.3,
  );
  const hy = y - 6.2;
  const head = blob(x, hy, 5.6, 5.9, 0.05, 8);
  let hair: string;
  switch (p.style) {
    case 0: // neat cap of hair
      hair = `M${x - 5.8} ${hy}C${x - 6.5} ${hy - 7.5} ${x + 6.5} ${hy - 7.5} ${x + 5.8} ${hy}C${x + 3} ${hy - 3.4} ${x - 2} ${hy - 4.2} ${x - 5.8} ${hy}Z`;
      break;
    case 1: // spikes
      hair = `M${x - 5} ${hy - 2.4}l1 -4 1.6 2.4 1.4 -3.6 1.4 3.2 1.8 -3.4 1.2 3.6 1.8 -2.2 0.6 3.6Z`;
      break;
    case 2: // curls
      hair = smoothCurls(x, hy);
      break;
    default: // long hair down the sides
      hair = `M${x - 6} ${hy + 6}C${x - 8.5} ${hy - 4} ${x - 4} ${hy - 7.8} ${x} ${hy - 6.4}C${x + 4} ${hy - 7.8} ${x + 8.5} ${hy - 4} ${x + 6} ${hy + 6}L${x + 4.6} ${hy + 1}C${x + 3} ${hy - 3} ${x - 3} ${hy - 3} ${x - 4.6} ${hy + 1}Z`;
  }
  return { torso, head, hair, hy };
}

function smoothCurls(x: number, hy: number) {
  let d = `M${x - 6} ${hy - 0.5}`;
  const bumps: Pt[] = [
    [x - 5, hy - 5],
    [x - 1.5, hy - 7],
    [x + 2.5, hy - 6.8],
    [x + 5.8, hy - 4],
    [x + 6.2, hy - 0.4],
  ];
  for (const [bx, by] of bumps) d += `A2.4 2.4 0 0 1 ${bx} ${by}`;
  return `${d}C${x + 3} ${hy - 3.5} ${x - 3} ${hy - 3.5} ${x - 6} ${hy - 0.5}Z`;
}

function PersonArt({ p, bottom, fill }: { p: Person; bottom: number; fill: Fill }) {
  const { torso, head, hair, hy } = personPaths(p, bottom);
  const { x } = p;
  return (
    <g>
      <Shape d={torso} fill={fill(p.shirt)} />
      <path d={head} fill={p.skin} />
      <Ink d={head} width={0.9} />
      <path d={hair} fill={p.hair} className="mun-hair" />
      {p.asleep ? (
        <path
          d={`M${x - 3} ${hy + 0.4}q1 0.9 2 0M${x + 1} ${hy + 0.4}q1 0.9 2 0M${x - 0.8} ${hy + 3}a0.8 0.8 0 1 0 1.6 0a0.8 0.8 0 1 0 -1.6 0`}
          className="mun-face"
        />
      ) : (
        <>
          <path d={dot(x - 2.1, hy - 0.2, 0.75) + dot(x + 2.1, hy - 0.2, 0.75)} fill={C.ink} />
          <path d={`M${x - 2.2} ${hy + 2.2}q2.2 2 4.4 0`} className="mun-face" />
        </>
      )}
    </g>
  );
}

const SKIN = ['#f3d1ad', '#d9a57c', '#b98058', '#8a5a3c'];
const HAIR = ['#3b2a20', '#1f1b18', '#6b4226', '#c98a3b'];

const CHAIRS: Person[] = [
  { x: 146, y: 47, shirt: 'purple', skin: SKIN[1]!, hair: HAIR[1]!, style: 3 },
  { x: 182, y: 47, shirt: 'green', skin: SKIN[0]!, hair: HAIR[2]!, style: 0 },
];
const SPEAKER: Person = { x: 84, y: 49, shirt: 'blue', skin: SKIN[2]!, hair: HAIR[0]!, style: 2 };

/* ---------- podium + mic ---------- */

const PODIUM = {
  front: wob(
    [
      [72, 66],
      [100, 66],
      [97.5, 108],
      [74.5, 108],
    ],
    0.35,
    true,
  ),
  lectern: wob(
    [
      [68.5, 61],
      [103.5, 61],
      [101.5, 66.5],
      [70.5, 66.5],
    ],
    0.25,
    true,
  ),
  stalk: 'M92 61Q90.5 55 94 50.6',
};

/* ---------- delegates ---------- */

const NAMES = ['Zubia', 'Kaloo', 'Pebbla', 'Snoria', 'Moovia', 'Tuftia', 'Wobbla'];
const DX = [32, 74, 117, 160, 203, 246, 288];
const DT = [128, 145, 156, 160, 156, 145, 128];
const SLEEPER = 3;
/** who raises first: outside in */
const VOTE_ORDER = [0, 6, 1, 5, 2, 4];
const VOTERS = VOTE_ORDER.length;
const CARD_STRIPE: Hatch[] = ['red', 'green', 'orange', 'purple', 'blue', 'yellow', 'pink'];
const SHIRTS: Hatch[] = ['orange', 'sky', 'pink', 'yellow', 'red', 'purple', 'green'];

const DELEGATES = DX.map((x, i) => {
  const t = DT[i]!;
  const person: Person = {
    x,
    y: t - 11,
    shirt: SHIRTS[i]!,
    skin: SKIN[(i * 3 + 1) % 4]!,
    hair: HAIR[(i * 2) % 4]!,
    style: ([1, 3, 0, 2, 3, 1, 0] as const)[i]!,
    asleep: i === SLEEPER,
  };
  return {
    i,
    x,
    t,
    person,
    name: NAMES[i]!,
    stripe: CARD_STRIPE[i]!,
    tilt: i === SLEEPER ? 0 : (i % 2 ? 5 : -5) * (i < 3 ? 1 : -1),
    deskTop: wob(
      [
        [x - 21, t + 0.5],
        [x + 21, t + 0.5],
        [x + 23.5, t + 5],
        [x - 23.5, t + 5],
      ],
      0.25,
      true,
    ),
    deskFront: wob(
      [
        [x - 23, t + 5],
        [x + 23, t + 5],
        [x + 22.5, t + 21.5],
        [x - 22.5, t + 22],
      ],
      0.4,
      true,
    ),
    card: box(x - 16, t - 12, x + 16, t + 0.5, 0.25),
    stripePath: `M${x - 15.6} ${t - 11.6}H${x + 15.6}V${t - 9}H${x - 15.6}Z`,
    arm: wob([[x + 9, t + 2], [x + 10, t + 19]], 0.3),
    box: [x - 18, t - 14, 36, 36] as Box,
  };
});

/* ---------- tally sign on the dais ---------- */

const TALLY_BOX: Box = [138, 66, 66, 31];
const TALLY = {
  paper: box(143, 70, 199, 93.5, 0.35),
  tapes: [box(140.5, 67.5, 148.5, 71.8, 0.2), box(193.5, 67.3, 201.5, 71.6, 0.2)],
  marks: [
    wob([[151, 82], [151.5, 91]], 0.3),
    wob([[155, 82], [155.3, 91]], 0.3),
    wob([[159, 82], [159.2, 91.2]], 0.3),
    wob([[163, 82], [163.4, 91]], 0.3),
    wob([[148.5, 89.5], [166, 83.5]], 0.3),
    wob([[170, 82], [170.3, 91]], 0.3),
  ],
};

/* ---------- gavel ---------- */

const GAVEL_BOX: Box = [196, 32, 38, 30];
const GAVEL_PIVOT: Pt = [228, 48];
const GAVEL = {
  handle: wob([[214, 53.2], [228.5, 47.6]], 0.2),
  head: box(203, 50, 215, 56.6, 0.2),
  band: `M206 50.2V56.4M212 50.2V56.4`,
};
const BONK_BOX: Box = [194, 48, 34, 16];
const BONK = 'M202 55l-5 -2.5M202.5 58.5l-5.5 0.5M203.5 61.5l-4 3M222 55.5l4.5 -2M221.5 59l5 0.6';

/* ---------- speech bubbles ---------- */

interface Slot {
  at: Box;
  rect: [number, number, number, number];
  tail: Pt;
}
const SLOTS: Slot[] = [
  { at: [2, 41, 80, 22], rect: [4, 44, 71, 61], tail: [79, 47] },
  { at: [208, 92, 76, 30], rect: [211, 93.5, 281, 110.5], tail: [241, 120] },
  { at: [98, 102, 76, 31], rect: [101, 104, 171, 121], tail: [117, 131] },
];
const SLOT_ART = SLOTS.map(({ rect: [x1, y1, x2, y2], tail: [px, py] }) => {
  const cy = (y1 + y2) / 2;
  const r = 6;
  // rounded box drawn as one loop, with a tail notch on the side nearest the speaker
  const top = (py < y1 ? (t: number) => `H${t - 3}L${px} ${py}L${t + 4} ${y1}` : () => '')(Math.min(Math.max(px, x1 + 8), x2 - 8));
  const right = px > x2 ? `V${cy - 3}L${px} ${py}L${x2} ${cy + 3.5}` : '';
  const bottom = py > y2 ? ((t: number) => `H${t + 4}L${px} ${py}L${t - 3} ${y2}`)(Math.min(Math.max(px, x1 + 8), x2 - 8)) : '';
  const body =
    `M${x1 + r} ${y1}${top}H${x2 - r}Q${x2} ${y1} ${x2} ${y1 + r}${right}V${y2 - r}Q${x2} ${y2} ${x2 - r} ${y2}` +
    `${bottom}H${x1 + r}Q${x1} ${y2} ${x1} ${y2 - r}V${y1 + r}Q${x1} ${y1} ${x1 + r} ${y1}Z`;
  return { body, cx: (x1 + x2) / 2, cy };
});
/** podium's first bubble when a vote is called */
const IDLE_LINES = ['Point of order!', 'Seconded!', 'Right of reply!', 'Objection!', 'Motion to vote!', 'I yield my time', 'Hear, hear!'];
const IDLE_SLOTS = [0, 1, 2, 1, 0, 2, 1];

/* ---------- order! + rubber stamp ---------- */

const ORDER_BOX: Box = [190, 21, 52, 19];
const ORDER_LINES = 'M197 27.5l-3 -2.5M196.5 33l-3.5 0.5M233 27l3 -2.5M233.5 32.5l3.5 0.5';

const STAMP_BOX: Box = [150, 144, 160, 52];
const STAMP_C: Pt = [230, 170];
const STAMP = {
  outer: box(160, 151.5, 300, 188.5, 0.35),
  inner: box(164, 155.5, 296, 184.5, 0.3),
  check: 'M272 170l4.5 5 9 -11',
  specks: Array.from({ length: 70 }, () => dot(150 + pen() * 160, 144 + pen() * 52, 0.35 + pen() * 1.1)).join(''),
};

const COMMITTEES = ['UNSC', 'DISEC', 'SOCHUM', 'UN Women', 'PNA'];

/* ---------- static layers (memoised: never re-render after mount) ---------- */

const Defs = memo(function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      {HATCHES.map((h) => (
        <pattern key={h} id={`${uid}-${h}`} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <rect width="3.2" height="3.2" fill={C[h]} opacity={0.24} />
          <path d="M0.4 0V3.2" stroke={C[h]} strokeWidth={1.25} opacity={0.72} />
        </pattern>
      ))}
    </defs>
  );
});

const Room = memo(function Room({ uid }: { uid: string }) {
  const fill: Fill = (h) => `url(#${uid}-${h})`;
  return (
    <svg className="mun-layer" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" focusable="false">
      <Defs uid={uid} />
      {/* wall, panelling, floor */}
      <rect width={W} height={FLOOR} fill="#f4ead3" />
      <rect y="84" width={W} height={FLOOR - 84} fill="#eadbb9" />
      <rect y={FLOOR} width={W} height={H - FLOOR} fill="#dcb683" />
      <rect y={FLOOR} width={W} height={H - FLOOR} fill={fill('woodLight')} opacity={0.55} />
      <Ink d={ROOM.rail} width={0.8} halo={false} />
      <path d={ROOM.planks} className="mun-plank" />
      <path d={ROOM.seams} className="mun-plank" />
      <Ink d={ROOM.wallLine} width={1.2} />

      {/* banner */}
      <path d={ROOM.bannerString} className="mun-string" />
      <Shape d={ROOM.tailL} fill={fill('sky')} color={C.blue} width={0.9} />
      <Shape d={ROOM.tailR} fill={fill('sky')} color={C.blue} width={0.9} />
      <path d={ROOM.banner} fill={C.paper} />
      <Ink d={ROOM.banner} color={C.blue} width={1.1} />
      <text x="160" y="17" textAnchor="middle" className="mun-banner">
        THE GRAND DEBATE ’26
      </text>

      {/* flag poles (the cloth flutters in its own pieces) */}
      <Ink d={poleLines} color="#7a5332" width={1.3} halo={false} />
      <Ink d={poleFeet} width={1.2} halo={false} />
      <path d={poleKnobs} fill={C.yellow} stroke={C.orange} strokeWidth={0.5} />

      {/* the chair: two people behind a long table */}
      {CHAIRS.map((p) => (
        <PersonArt key={p.x} p={p} bottom={62} fill={fill} />
      ))}
      <Shape d={DAIS.cloth} fill={fill('blue')} color={C.blue} />
      <path d={DAIS.folds} className="mun-fold" />
      <Shape d={DAIS.top} fill={fill('wood')} />
      <Shape d={DAIS.block} fill={fill('wood')} width={0.8} />

      {/* speaker at the podium */}
      <PersonArt p={SPEAKER} bottom={62} fill={fill} />
      <Ink d={PODIUM.stalk} width={1.1} halo={false} />
      <ellipse cx="94.6" cy="49" rx="2.3" ry="2.6" fill={C.ink} transform="rotate(25 94.6 49)" />
      <Shape d={PODIUM.front} fill={fill('wood')} />
      <Shape d={PODIUM.lectern} fill={fill('woodLight')} />
      <path d={star(86, 84, 6.2)} fill={C.yellow} stroke={C.orange} strokeWidth={0.7} strokeLinejoin="round" />
      <text x="86" y="100" textAnchor="middle" className="mun-tiny mun-podium-text">
        18–20 Nov
      </text>

      {/* delegates sitting behind their desks (desks are drawn in the front layer) */}
      {DELEGATES.map((g) => (
        <PersonArt key={g.i} p={g.person} bottom={g.t + 3} fill={fill} />
      ))}
    </svg>
  );
});

const Desks = memo(function Desks({ uid }: { uid: string }) {
  const fill: Fill = (h) => `url(#${uid}-${h})`;
  return (
    <svg className="mun-layer" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" focusable="false">
      {DELEGATES.map((g) => (
        <g key={g.i}>
          <path d={g.deskFront} fill="#c99458" />
          <Shape d={g.deskFront} fill={fill('wood')} />
          <path d={g.deskTop} fill="#e8c697" />
          <Ink d={g.deskTop} width={0.9} halo={false} />
        </g>
      ))}
    </svg>
  );
});

function Flag({ i, fill }: { i: number; fill: Fill }) {
  const x = POLES[i]!;
  const f = FLAGS[i]!;
  const at: Box = [x, POLE_TOP - 2, FLAG_W + 3, FLAG_H + 6];
  return (
    <Piece
      at={at}
      className="mun-flag"
      style={
        {
          transformOrigin: originOf(at, x, POLE_TOP + 3),
          '--t': `${1.1 + ((i * 7) % 5) * 0.12}s`,
          '--d': `${-i * 0.37}s`,
        } as CSSProperties
      }
    >
      <path d={FLAG_INK[i]} fill="#fbf4e4" />
      <path d={FLAG_INK[i]} fill={fill(f.base)} />
      {f.art(x + 0.8, POLE_TOP + 1.5)}
      <Ink d={FLAG_INK[i]!} width={0.8} halo={false} />
    </Piece>
  );
}

const Flags = memo(function Flags({ uid }: { uid: string }) {
  const fill: Fill = (h) => `url(#${uid}-${h})`;
  return (
    <>
      {POLES.map((_, i) => (
        <Flag key={i} i={i} fill={fill} />
      ))}
    </>
  );
});

/* ---------- the scene ---------- */

type StampState = 'none' | 'on' | 'off';

export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const uid = `mun${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const [raised, setRaised] = useState(0);
  const [bang, setBang] = useState(false);
  const [order, setOrder] = useState(false);
  const [stamp, setStamp] = useState<StampState>('none');
  const [stampKind, setStampKind] = useState(0);
  const [committee, setCommittee] = useState(0);
  const [bubbleOn, setBubbleOn] = useState(-1);
  const [bubbleText, setBubbleText] = useState<string[]>(['Motion to vote!', 'Seconded!', 'Point of order!']);
  const cycles = useRef(0);
  const lineRef = useRef(0);

  const say = (slot: number, text: string) => {
    setBubbleText((t) => (t[slot] === text ? t : t.map((v, i) => (i === slot ? text : v))));
    setBubbleOn(slot);
  };

  // idle: someone pipes up every few seconds
  useEffect(() => {
    if (reducedMotion || !visible || active) return;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const next = () => {
      const n = lineRef.current++;
      say(IDLE_SLOTS[n % IDLE_SLOTS.length]!, IDLE_LINES[n % IDLE_LINES.length]!);
      at(2000, () => setBubbleOn(-1));
      at(3400 + Math.random() * 1200, next);
    };
    at(900, next);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, visible, reducedMotion]);

  // active: call a vote, count it, bang the gavel, stamp it. Repeats while you keep looking.
  useEffect(() => {
    if (reducedMotion) return;
    if (!active) {
      setRaised(0);
      setBang(false);
      setOrder(false);
      setBubbleOn(-1);
      setStamp((s) => (s === 'on' ? 'off' : s));
      return;
    }
    if (!visible) return;

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const run = () => {
      const n = cycles.current++;
      setStampKind(n % 2);
      setCommittee(n % COMMITTEES.length);
      setRaised(0);
      setBang(false);
      setOrder(false);
      setStamp((s) => (s === 'on' ? 'off' : s));
      say(0, 'Motion to vote!');
      at(1500, () => setBubbleOn(-1));
      for (let k = 0; k < VOTERS; k++) at(420 + k * 230, () => setRaised(k + 1));
      at(1950, () => setBang(true));
      at(2130, () => setOrder(true));
      at(2560, () => setStamp('on'));
      at(3050, () => setBang(false));
      at(3500, () => setOrder(false));
      at(6600, () => {
        setStamp('off');
        setRaised(0);
      });
      at(7600, run);
    };
    run();
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, visible, reducedMotion]);

  // reduced motion: one calm, finished frame (the vote has passed)
  const still = reducedMotion;
  const shownRaised = still ? VOTERS : raised;
  const shownStamp: StampState = still ? 'on' : stamp;
  const shownBubble = still ? 0 : bubbleOn;
  const texts = still ? ['Motion to vote!', '', ''] : bubbleText;
  const kind = still ? 0 : stampKind;
  const raisedSet = new Set(VOTE_ORDER.slice(0, shownRaised));

  const cls = ['mun-scene', still && 'mun-still', !visible && !still && 'mun-paused'].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <Room uid={uid} />
      <Flags uid={uid} />

      {/* speaker's arm, waving about */}
      <Piece at={[60, 34, 22, 24]} className="mun-arm" style={{ transformOrigin: originOf([60, 34, 22, 24], 78, 53) }}>
        <path d="M78 53Q72 50 68.5 42.5" className="mun-limb-ink" />
        <path d="M78 53Q72 50 68.5 42.5" className="mun-limb" stroke={C.sky} />
        <circle cx="68.2" cy="41.6" r="2.1" fill={SPEAKER.skin} stroke={C.ink} strokeWidth={0.6} />
      </Piece>

      {/* chair's name card: the committee in session */}
      <Piece at={[146, 49, 36, 13]} className="mun-namecard">
        <path d={box(147.5, 51, 180.5, 60.6, 0.2)} fill={C.paper} />
        <Ink d={box(147.5, 51, 180.5, 60.6, 0.2)} width={0.7} halo={false} />
        <text x="164" y="58.4" textAnchor="middle" className="mun-tiny mun-committee">
          {COMMITTEES[still ? 0 : committee]}
        </text>
      </Piece>

      {/* tally: one crayon mark per raised placard */}
      <Piece at={TALLY_BOX} className="mun-tally">
        <g transform="rotate(-2.5 171 81)">
          <path d={TALLY.paper} fill={C.paper} />
          <Ink d={TALLY.paper} width={0.8} halo={false} />
          {TALLY.tapes.map((d, i) => (
            <path key={i} d={d} fill="#f1e2a4" opacity={0.85} />
          ))}
          <text x="148" y="79.6" className="mun-tally-label">
            FOR
          </text>
          {TALLY.marks.map((d, i) => (
            <path key={i} d={d} className={`mun-mark${i < shownRaised ? ' mun-mark--on' : ''}`} />
          ))}
          <text x="194" y="91" textAnchor="end" className="mun-tally-count">
            {shownRaised}
          </text>
        </g>
      </Piece>

      {/* gavel + its bonk lines */}
      <Piece
        at={GAVEL_BOX}
        className={`mun-gavel${bang && !still ? ' mun-gavel--bang' : ''}`}
        style={{ transformOrigin: originOf(GAVEL_BOX, ...GAVEL_PIVOT) }}
      >
        <Ink d={GAVEL.handle} color="#7a5332" width={2.2} halo={false} />
        <path d={GAVEL.head} fill="#8d5a33" />
        <Ink d={GAVEL.head} width={0.9} halo={false} />
        <path d={GAVEL.band} stroke={C.yellow} strokeWidth={1} />
      </Piece>
      <Piece at={BONK_BOX} className={`mun-bonk${bang && !still ? ' mun-bonk--on' : ''}`}>
        <path d={BONK} className="mun-bonk-lines" />
      </Piece>

      {/* sleepy delegate's zzz */}
      <Piece at={[163, 124, 22, 20]} className="mun-zzz">
        <text x="166" y="141" className="mun-z">
          z
        </text>
        <text x="171" y="135.5" className="mun-z mun-z--m">
          z
        </text>
        <text x="176.5" y="130" className="mun-z mun-z--l">
          Z
        </text>
      </Piece>

      {/* placards: they sit on the desks, and go up (held high) during a vote */}
      {DELEGATES.map((g) => (
        <Piece
          key={g.i}
          at={g.box}
          className={`mun-card${raisedSet.has(g.i) ? ' mun-card--up' : ''}`}
          style={
            {
              transformOrigin: originOf(g.box, g.x, g.t + 0.5),
              '--tilt': `${g.tilt}deg`,
            } as CSSProperties
          }
        >
          <path d={g.arm} className="mun-limb-ink" />
          <path d={g.arm} className="mun-limb" stroke={C[g.person.shirt]} />
          <circle cx={g.x + 9} cy={g.t + 2.6} r={2} fill={g.person.skin} stroke={C.ink} strokeWidth={0.55} />
          <path d={g.card} fill={C.paper} />
          <path d={g.stripePath} fill={C[g.stripe]} opacity={0.85} />
          <Ink d={g.card} width={0.8} halo={false} />
          <text x={g.x} y={g.t - 1.6} textAnchor="middle" className="mun-card-name">
            {g.name}
          </text>
        </Piece>
      ))}

      <Desks uid={uid} />

      {/* speech bubbles */}
      {SLOTS.map((s, i) => (
        <Piece
          key={i}
          at={s.at}
          className={`mun-bubble${shownBubble === i ? ' mun-bubble--on' : ''}`}
          style={{ transformOrigin: originOf(s.at, ...s.tail) }}
        >
          <path d={SLOT_ART[i]!.body} fill="#fffdf7" />
          <Ink d={SLOT_ART[i]!.body} width={0.9} />
          <text x={SLOT_ART[i]!.cx} y={SLOT_ART[i]!.cy + 3.3} textAnchor="middle" className="mun-bubble-text">
            {texts[i]}
          </text>
        </Piece>
      ))}

      {/* "Order!" */}
      <Piece at={ORDER_BOX} className={`mun-order${order && !still ? ' mun-order--on' : ''}`} style={{ transformOrigin: originOf(ORDER_BOX, 215, 38) }}>
        <text x="215" y="35.5" textAnchor="middle" className="mun-order-text">
          Order!
        </text>
        <path d={ORDER_LINES} className="mun-order-lines" />
      </Piece>

      {/* the rubber stamp */}
      <Piece
        at={STAMP_BOX}
        className={`mun-stamp${shownStamp === 'on' ? ' mun-stamp--on' : shownStamp === 'off' ? ' mun-stamp--off' : ''}`}
        style={
          {
            transformOrigin: originOf(STAMP_BOX, ...STAMP_C),
            '--mun-stamp': kind === 0 ? C.red : C.green,
          } as CSSProperties
        }
      >
        <defs>
          <mask id={`${uid}-worn`} maskUnits="userSpaceOnUse" x={STAMP_BOX[0]} y={STAMP_BOX[1]} width={STAMP_BOX[2]} height={STAMP_BOX[3]}>
            <rect x={STAMP_BOX[0]} y={STAMP_BOX[1]} width={STAMP_BOX[2]} height={STAMP_BOX[3]} fill="#fff" />
            <path d={STAMP.specks} fill="#000" />
          </mask>
        </defs>
        <g mask={`url(#${uid}-worn)`} className="mun-stamp-ink">
          <path d={STAMP.outer} className="mun-stamp-edge" />
          <path d={STAMP.inner} className="mun-stamp-edge mun-stamp-edge--thin" />
          {kind === 0 ? (
            <text x="230" y="176.5" textAnchor="middle" textLength="122" lengthAdjust="spacingAndGlyphs" className="mun-stamp-text">
              MOTION PASSES
            </text>
          ) : (
            <>
              <text x="219" y="177" textAnchor="middle" textLength="98" lengthAdjust="spacingAndGlyphs" className="mun-stamp-text">
                REGISTERED
              </text>
              <path d={STAMP.check} className="mun-stamp-check" />
            </>
          )}
        </g>
      </Piece>
    </div>
  );
}
