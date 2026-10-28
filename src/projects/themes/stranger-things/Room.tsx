/**
 * The living-room wall, drawn in one 160 x 100 SVG coordinate space (the scene window is 16:10).
 * The picture frame on the wall holds a smaller copy of the same room, which holds another:
 * recursion, Droste style.
 */

/** Deterministic "random" so the hand-painted wobble is the same on every render. */
const rand = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const ROWS = ['ABCDEFGH', 'IJKLMNOPQ', 'RSTUVWXYZ'];
const WIRE_Y = [7, 25, 43];
const COLORS = ['#ff4b3e', '#3d8bff', '#ffd23f', '#3ddc6a', '#ff8a2a', '#ff5fc8'];

export interface Bulb {
  ch: string;
  i: number;
  /** socket position on the wire */
  x: number;
  wireY: number;
  /** centre of the glass */
  gy: number;
  color: string;
  /** painted letter: position + tilt */
  lx: number;
  ly: number;
  rot: number;
}

export const BULBS: Bulb[] = ROWS.flatMap((row, r) => {
  const n = row.length;
  const x0 = n === 8 ? 19 : 13;
  const x1 = n === 8 ? 141 : 147;
  const base = ROWS.slice(0, r).join('').length;
  const wire = WIRE_Y[r] ?? 0;
  return [...row].map((ch, k) => {
    const i = base + k;
    const x = x0 + ((x1 - x0) * k) / (n - 1) + (rand(i, 1) - 0.5) * 2.2;
    const wireY = wire + (rand(i, 2) - 0.5) * 1.6;
    return {
      ch,
      i,
      x,
      wireY,
      gy: wireY + 2.9,
      color: COLORS[(i * 5 + r) % COLORS.length] ?? '#ff4b3e',
      lx: x + (rand(i, 4) - 0.5) * 2.4,
      ly: wire + 14.6 + (rand(i, 5) - 0.5) * 1.8,
      rot: (rand(i, 3) - 0.5) * 16,
    };
  });
});

/** One sagging wire per row, through every socket. */
const WIRES = ROWS.map((_, r) => {
  const row = BULBS.filter((b) => ROWS[r]?.includes(b.ch));
  const wire = WIRE_Y[r] ?? 0;
  const pts = [{ x: -3, y: wire - 2 }, ...row.map((b) => ({ x: b.x, y: b.wireY })), { x: 163, y: wire - 1.5 }];
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let k = 1; k < pts.length; k++) {
    const a = pts[k - 1]!;
    const b = pts[k]!;
    const sag = 2 + rand(k + r * 11, 6) * 1.6;
    d += ` Q ${((a.x + b.x) / 2).toFixed(2)} ${(Math.max(a.y, b.y) + sag).toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }
  return d;
});

/** Vines grouped by the corner they creep in from; `origin` is that root, as % of the window. */
export const VINE_GROUPS = [
  {
    origin: '0% 100%',
    vines: ['M -3 104 C 6 90 1 78 7 66 S 12 48 5 36 S 2 20 8 8'],
    tendrils: ['M 7 66 C 12 63 15 58 20 60', 'M 5 36 C 10 34 12 30 17 31', 'M 4 50 C 9 50 9 54 13 53'],
  },
  {
    origin: '0% 0%',
    vines: ['M -3 -2 C 10 4 20 2 30 6 S 46 4 54 1'],
    tendrils: ['M 30 6 C 33 11 37 11 38 15', 'M 18 2.5 C 18 7 15 9 16 13'],
  },
  {
    origin: '100% 0%',
    vines: ['M 163 -3 C 156 8 158 18 150 26 S 152 42 156 50'],
    tendrils: ['M 150 26 C 145 27 143 31 139 30', 'M 157 12 C 152 11 150 14 146 12'],
  },
  {
    origin: '100% 100%',
    vines: ['M 163 104 C 156 96 160 90 154 84'],
    tendrils: ['M 154 84 C 150 82 148 78 150 74'],
  },
  {
    origin: '0% 98%',
    vines: ['M -3 98 C 10 96 18 99 30 95'],
    tendrils: ['M 20 97 C 22 92 26 92 27 88'],
  },
];

const MOLD = [
  { cx: 24, cy: 46, rx: 14, ry: 8 },
  { cx: 96, cy: 6, rx: 18, ry: 7 },
  { cx: 148, cy: 38, rx: 12, ry: 14 },
  { cx: 70, cy: 54, rx: 14, ry: 6 },
];

export interface RoomIds {
  paper: string;
  paperUp: string;
  dark: string;
  darkUp: string;
  glow: string;
  sheen: string;
  mold: string;
}

/** Gradients, patterns and the neon blur: defined once, used by every copy of the room. */
export function RoomDefs({ ids }: { ids: RoomIds }) {
  return (
    <defs>
      <pattern id={ids.paper} width="8" height="10" patternUnits="userSpaceOnUse">
        <rect width="8" height="10" fill="#7a6a47" />
        <rect width="1.3" height="10" fill="#6b5c3c" />
        <rect x="4" width="0.25" height="10" fill="#8b7a52" />
        <g fill="#927e50">
          <circle cx="4" cy="4.2" r="0.7" />
          <circle cx="4" cy="5.8" r="0.7" />
          <circle cx="3.2" cy="5" r="0.7" />
          <circle cx="4.8" cy="5" r="0.7" />
        </g>
        <circle cx="4" cy="5" r="0.35" fill="#5b4c31" />
      </pattern>
      <pattern id={ids.paperUp} width="8" height="10" patternUnits="userSpaceOnUse">
        <rect width="8" height="10" fill="#37434f" />
        <rect width="1.3" height="10" fill="#2e3944" />
        <rect x="4" width="0.25" height="10" fill="#3f4c59" />
        <g fill="#435160">
          <circle cx="4" cy="4.2" r="0.7" />
          <circle cx="4" cy="5.8" r="0.7" />
          <circle cx="3.2" cy="5" r="0.7" />
          <circle cx="4.8" cy="5" r="0.7" />
        </g>
        <circle cx="4" cy="5" r="0.35" fill="#222b34" />
      </pattern>
      <radialGradient id={ids.dark} cx="0.5" cy="0.32" r="0.75">
        <stop offset="0" stopColor="#000" stopOpacity="0.16" />
        <stop offset="0.55" stopColor="#000" stopOpacity="0.48" />
        <stop offset="1" stopColor="#000" stopOpacity="0.86" />
      </radialGradient>
      <radialGradient id={ids.darkUp} cx="0.5" cy="0.4" r="0.8">
        <stop offset="0" stopColor="#0a1622" stopOpacity="0.15" />
        <stop offset="0.6" stopColor="#05101a" stopOpacity="0.5" />
        <stop offset="1" stopColor="#02060b" stopOpacity="0.88" />
      </radialGradient>
      <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.4" stopColor="#fff" stopOpacity="0.1" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={ids.mold}>
        <stop offset="0" stopColor="#0b1117" stopOpacity="0.7" />
        <stop offset="1" stopColor="#0b1117" stopOpacity="0" />
      </radialGradient>
      <filter id={ids.glow} x="-20%" y="-60%" width="140%" height="220%">
        <feGaussianBlur stdDeviation="1.3" />
      </filter>
    </defs>
  );
}

function TitleWords({ cls }: { cls: string }) {
  return (
    <g className={cls}>
      <text x="61" y="81" textAnchor="middle" fontSize="11" textLength="78" lengthAdjust="spacingAndGlyphs">
        <tspan fontSize="14.5">R</tspan>ECURSIO<tspan fontSize="14.5">N</tspan>
      </text>
      <text x="61" y="94.5" textAnchor="middle" fontSize="10" textLength="34" lengthAdjust="spacingAndGlyphs">
        HELL
      </text>
      <path d="M 33.5 69.6 H 88.5 M 25 91 H 41 M 81 91 H 97" />
    </g>
  );
}

/** The blurred red halo behind the neon (static: drawn once). */
export function TitleHalo({ glowId, opacity = 1 }: { glowId: string; opacity?: number }) {
  return (
    <g className="st-title" filter={`url(#${glowId})`} opacity={opacity}>
      <TitleWords cls="st-title__glow" />
    </g>
  );
}

/** The crisp neon tubes. */
export function TitleTubes() {
  return (
    <g className="st-title">
      <TitleWords cls="st-title__tube" />
      <TitleWords cls="st-title__core" />
    </g>
  );
}

/** Vines creeping in from the edges of the upside down (one corner group, or all of them). */
export function Vines({ group }: { group?: number }) {
  const groups = group === undefined ? VINE_GROUPS : VINE_GROUPS.slice(group, group + 1);
  return (
    <g fill="none" strokeLinecap="round">
      {groups.map((g, gi) => (
        <g key={gi}>
          {g.vines.map((d, k) => (
            <g key={k}>
              <path d={d} stroke="#110a0d" strokeWidth="2.9" />
              <path d={d} stroke="#3b232b" strokeWidth="1.7" />
              <path d={d} stroke="#7a515b" strokeWidth="0.4" />
            </g>
          ))}
          {g.tendrils.map((d, k) => (
            <g key={`t${k}`}>
              <path d={d} stroke="#140c10" strokeWidth="0.95" />
              <path d={d} stroke="#6a444d" strokeWidth="0.25" />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

export type World = 'normal' | 'upside';

interface RoomProps {
  ids: RoomIds;
  world: World;
  /** how many more copies of the room live inside the picture frame */
  depth: number;
  /**
   * The top-level room is split into separately composited layers (lights, vines, vignettes,
   * title) so that animating them never repaints this SVG. Copies inside the frame draw it all.
   */
  live: boolean;
}

/** One world of the room, completely static: state changes only cross-fade whole layers. */
export function Room({ ids, world, depth, live }: RoomProps) {
  const up = world === 'upside';
  const fx = 119;
  const fy = 67.5;
  const fw = 31;
  const fh = 19.375;
  const glass = live ? (up ? 0.18 : 0.4) : up ? 0.25 : 1;
  return (
    <g>
      {/* ---------- wall, rail and panelling ---------- */}
      <rect width="160" height="62" fill={`url(#${up ? ids.paperUp : ids.paper})`} />
      {up && (
        <g fill={`url(#${ids.mold})`}>
          {MOLD.map((m, k) => (
            <ellipse key={k} {...m} />
          ))}
        </g>
      )}
      <rect y="64" width="160" height="36" fill={up ? '#1c252e' : '#3a2516'} />
      <g fill={up ? '#111820' : '#24160c'}>
        {Array.from({ length: 17 }, (_, k) => (
          <rect key={k} x={k * 10 - 0.25} y="64" width="0.5" height="36" />
        ))}
      </g>
      <rect y="61.6" width="160" height="2.6" fill={up ? '#29333d' : '#5a3b22'} />
      {!up && <rect y="61.6" width="160" height="0.45" fill="#7d5634" />}

      {/* ---------- lights and painted letters ---------- */}
      <g fill="none" stroke="#13180f" strokeWidth="0.45" strokeLinecap="round">
        {WIRES.map((d, k) => (
          <path key={k} d={d} />
        ))}
      </g>
      {BULBS.map((b) => (
        <g key={b.ch}>
          {!live && !up && <circle cx={b.x} cy={b.gy} r="3.6" fill={b.color} opacity="0.3" />}
          <rect x={b.x - 0.6} y={b.wireY - 0.2} width="1.2" height="1.5" rx="0.2" fill="#1c2a1b" />
          <ellipse cx={b.x} cy={b.gy} rx="1.05" ry="1.6" fill="#1a1512" />
          <ellipse cx={b.x} cy={b.gy} rx="1.05" ry="1.6" fill={b.color} opacity={glass} />
          <text
            className={up ? 'st-letter st-letter--up' : 'st-letter'}
            x={b.lx}
            y={b.ly}
            fontSize="10"
            textAnchor="middle"
            transform={`rotate(${b.rot.toFixed(1)} ${b.lx.toFixed(2)} ${(b.ly - 3.5).toFixed(2)})`}
          >
            {b.ch}
          </text>
        </g>
      ))}

      {/* ---------- the picture on the wall: this room, again ---------- */}
      <path d={`M ${fx + 2} ${fy - 0.6} L ${fx + fw / 2} 59.4 L ${fx + fw - 2} ${fy - 0.6}`} fill="none" stroke="#1a120b" strokeWidth="0.3" />
      <circle cx={fx + fw / 2} cy="59.3" r="0.55" fill="#9a8a6a" />
      <g transform={`rotate(-2.5 ${fx + fw / 2} ${fy + fh / 2})`}>
        <rect x={fx - 1.8} y={fy - 1.8} width={fw + 3.6} height={fh + 3.6} rx="0.6" fill="#6e4a24" stroke="#26180b" strokeWidth="0.35" />
        <rect x={fx - 0.9} y={fy - 0.9} width={fw + 1.8} height={fh + 1.8} fill="none" stroke="#a37a44" strokeWidth="0.3" />
        <rect x={fx} y={fy} width={fw} height={fh} fill="#0b0a09" />
        {depth > 0 && (
          <svg x={fx} y={fy} width={fw} height={fh} viewBox="0 0 160 100" preserveAspectRatio="none">
            <Room ids={ids} world={world} depth={depth - 1} live={false} />
          </svg>
        )}
        <rect x={fx} y={fy} width={fw} height={fh} fill={`url(#${ids.sheen})`} />
      </g>

      {/* ---------- copies paint their own vines, vignette and title ---------- */}
      {!live && up && <Vines />}
      {(!live || !up) && <rect width="160" height="100" fill={`url(#${ids.dark})`} />}
      {!live && up && <rect width="160" height="100" fill={`url(#${ids.darkUp})`} />}
      {!live && <TitleHalo glowId={ids.glow} opacity={up ? 1 : 0.75} />}
      {!live && <TitleTubes />}
    </g>
  );
}
