import type { ThemeSceneProps } from '../../theme.ts';
import { createRng } from '../../../crayon/random.ts';
import { at, wobbly, wobblyEllipse, wobblyRect, type Pt, type Vars } from '../../sketch.ts';
import './dashboard.css';

const rng = createRng(2024);
const INK = '#3a3836';
const CARD = '#fbfbf8';

/** The front spreadsheet: 86 x 104 at (10, 48); rows every 9 units under a header and a letters row. */
const ROWS = [65, 74, 83, 92, 101, 110, 119, 128, 137, 146];
const COLS = [22, 46, 70];
const CELLS: [number, number, string][] = [
  [26, 0, '1,240'],
  [50, 0, '38'],
  [74, 0, 'rock'],
  [26, 1, '980'],
  [50, 1, '37'],
  [74, 1, 'pop'],
  [26, 2, '1.1k'],
  [50, 2, '29'],
  [74, 2, 'jazz'],
  [26, 3, '1,410'],
  [50, 3, '52'],
  [74, 3, 'hip'],
  [26, 4, '760'],
  [50, 4, '1.4k'],
  [74, 4, 'edm'],
  [26, 5, '1,030'],
  [50, 5, '44'],
  [74, 5, 'rock'],
  [26, 6, '890'],
  [50, 6, '31'],
  [74, 6, 'pop'],
];
/** Cells that arrive broken: the overlay covers the clean value until the data is fixed. */
const ERRORS: [number, number, string][] = [
  [50, 1, '#N/A'],
  [26, 3, '??'],
  [50, 4, '#REF!'],
];

/** Bars of the genre chart (2024 heights; --alt scales them to the 2023 numbers). */
const BARS = [
  { x: 142, h: 46, c: '#3a6fc4', alt: 0.72 },
  { x: 160, h: 36, c: '#e8b931', alt: 1.2 },
  { x: 178, h: 28, c: '#d6453d', alt: 0.85 },
  { x: 196, h: 40, c: '#3f9a4f', alt: 0.55 },
  { x: 214, h: 22, c: '#7b52ab', alt: 1.45 },
];
const BAR_BASE = 126;

const SALES: Pt[] = [
  [138, 177],
  [156, 171],
  [174, 173],
  [192, 163],
  [210, 166],
  [228, 157],
  [246, 159],
  [264, 151],
  [282, 153],
  [300, 147],
];
const SALES_LINE = wobbly(SALES, rng, 0.3, 1);

const card = (x: number, y: number, w: number, h: number) => (
  <path d={wobblyRect(x, y, w, h, rng, 0.35)} fill={CARD} stroke="#c9c4b8" strokeWidth="1" />
);

const sheet = (x: number, y: number, angle: number, name: string) => (
  <g transform={`rotate(${angle} ${x + 43} ${y + 52})`}>
    <path d={wobblyRect(x, y, 86, 104, rng, 0.4)} fill="#fff" stroke={INK} strokeWidth="1.1" />
    <rect x={x} y={y} width="86" height="10" fill="#217346" />
    <text x={x + 4} y={y + 7.4} className="dd-text dd-text--sheet">
      {name}
    </text>
  </g>
);

const ART = (
  <svg className="dd-art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" focusable="false">
    <rect width="320" height="200" fill="#efe7d6" />

    {/* messy sources */}
    {sheet(16, 26, -7, 'regions.xlsx')}
    {sheet(14, 36, 4, 'genres.xlsx')}
    <path d={wobblyEllipse(84, 50, 9, 8, rng, 0.06)} fill="none" stroke="#b07a45" strokeWidth="1.6" opacity="0.5" />
    <path d={wobblyRect(10, 48, 86, 104, rng, 0.4)} fill="#fff" stroke={INK} strokeWidth="1.1" />
    <rect x="10" y="48" width="86" height="10" fill="#217346" />
    <text x="14" y="55.4" className="dd-text dd-text--sheet">
      sales.xlsx
    </text>
    <rect x="10" y="58" width="86" height="7" fill="#e9efe9" />
    {['A', 'B', 'C'].map((l, i) => (
      <text key={l} x={COLS[i]! + 10} y="63.3" className="dd-text dd-text--grid">
        {l}
      </text>
    ))}
    <path
      d={[...COLS.map((x) => `M${x} 58V152`), ...ROWS.map((y) => `M10 ${y}H96`)].join('')}
      stroke="#d8ddd8"
      strokeWidth="0.6"
    />
    {ROWS.slice(0, 9).map((y, i) => (
      <text key={y} x="13" y={y + 6.3} className="dd-text dd-text--grid">
        {i + 1}
      </text>
    ))}
    {CELLS.map(([x, row, v], i) => (
      <text key={i} x={x} y={ROWS[row]! + 6.3} className="dd-text dd-text--cell">
        {v}
      </text>
    ))}

    <path d={wobbly([[100, 104], [114, 102], [121, 104]], rng, 0.3)} className="dd-arrow" />
    <path d="M116.5 100.5l5 3.5-5.5 3" className="dd-arrow" />
    <text x="110" y="116" className="dd-text dd-text--note">
      clean
    </text>
    <text x="110" y="123" className="dd-text dd-text--note">
      & merge
    </text>

    <g transform="rotate(-3 44 176)">
      <rect x="12" y="160" width="64" height="32" fill="#fff3a8" />
      <text x="44" y="173" className="dd-text dd-text--sticky">
        presented to
      </text>
      <text x="44" y="184" className="dd-text dd-text--sticky">
        50+ people!
      </text>
    </g>

    {/* the report */}
    <path d={wobblyRect(124, 8, 188, 184, rng, 0.45)} fill="#fff" stroke={INK} strokeWidth="1.2" />
    <rect x="124.6" y="8.6" width="186.8" height="15" fill="#f2c811" />
    <text x="130" y="19.5" className="dd-text dd-text--title">
      Data-Dash · sales &amp; music
    </text>

    {card(130, 30, 62, 26)}
    <text x="136" y="39" className="dd-text dd-text--label">
      revenue
    </text>
    <text x="171" y="51" className="dd-text dd-text--up">
      ▲ 8%
    </text>
    {card(196, 30, 62, 26)}
    <text x="202" y="39" className="dd-text dd-text--label">
      streams
    </text>
    <text x="202" y="51.5" className="dd-text dd-text--kpi">
      3.4M
    </text>
    <text x="234" y="51" className="dd-text dd-text--up">
      ▲ 12%
    </text>
    <path d={wobblyRect(266, 30, 40, 11, rng, 0.3)} fill="none" stroke="#c9c4b8" strokeWidth="0.9" />
    <path d={wobblyRect(266, 44, 40, 11, rng, 0.3)} fill="none" stroke="#c9c4b8" strokeWidth="0.9" />

    {card(130, 62, 104, 72)}
    <text x="136" y="72" className="dd-text dd-text--label">
      plays by genre
    </text>
    <path d={wobbly([[137, BAR_BASE], [229, BAR_BASE]], rng, 0.2)} stroke={INK} strokeWidth="1" />
    {['rock', 'pop', 'jazz', 'hip-hop', 'edm'].map((g, i) => (
      <text key={g} x={BARS[i]!.x + 6} y="131.5" className="dd-text dd-text--axis">
        {g}
      </text>
    ))}

    {card(240, 62, 66, 72)}
    <text x="246" y="72" className="dd-text dd-text--label">
      by region
    </text>
    {[
      ['#3a6fc4', 'PK'],
      ['#e8b931', 'UK'],
      ['#d6453d', 'US'],
      ['#3f9a4f', 'UAE'],
    ].map(([c, r], i) => (
      <g key={r}>
        <circle cx={248 + i * 15} cy="127" r="1.8" fill={c} />
        <text x={251 + i * 15} y="129" className="dd-text dd-text--axis dd-text--legend">
          {r}
        </text>
      </g>
    ))}

    {card(130, 140, 176, 46)}
    <text x="136" y="149" className="dd-text dd-text--label">
      monthly sales
    </text>
    <path d={`${SALES_LINE}L300 182L138 182Z`} fill="#f2c811" opacity="0.22" />
    <path d={SALES_LINE} fill="none" stroke="#b8860b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Red-pen corrections over the front sheet: broken cells, circled. */
const ERRORS_ART = (
  <svg viewBox="0 0 86 104" focusable="false">
    {ERRORS.map(([x, row, v], i) => {
      const cx = x - 10;
      const cy = ROWS[row]! - 48;
      return (
        <g key={i}>
          <rect x={cx - 1.5} y={cy + 0.6} width="22" height="7.8" fill="#fff" />
          <text x={cx} y={cy + 6.3} className="dd-text dd-text--error">
            {v}
          </text>
          <path d={wobblyEllipse(cx + 9, cy + 4.4, 13, 5.6, rng, 0.08)} fill="none" stroke="#d6453d" strokeWidth="0.9" />
        </g>
      );
    })}
  </svg>
);

const bar = (h: number, c: string) => (
  <svg viewBox={`0 0 12 ${h}`} preserveAspectRatio="none" focusable="false">
    <path d={wobblyRect(0.6, 0.6, 10.8, h - 0.6, rng, 0.25)} fill={c} stroke={INK} strokeWidth="0.8" />
  </svg>
);
const BAR_ART = BARS.map((b) => bar(b.h, b.c));

const DONUT = (
  <svg viewBox="0 0 40 40" focusable="false">
    {[
      ['#3a6fc4', 38, 0],
      ['#e8b931', 26, 38],
      ['#d6453d', 22, 64],
      ['#3f9a4f', 14, 86],
    ].map(([c, len, start]) => (
      <circle
        key={c as string}
        cx="20"
        cy="20"
        r="14"
        fill="none"
        stroke={c as string}
        strokeWidth="9"
        pathLength="100"
        strokeDasharray={`${len} ${100 - (len as number)}`}
        strokeDashoffset={-(start as number)}
        transform="rotate(-90 20 20)"
      />
    ))}
    <circle cx="20" cy="20" r="18.6" fill="none" stroke={INK} strokeWidth="0.8" />
    <circle cx="20" cy="20" r="9.4" fill={CARD} stroke={INK} strokeWidth="0.8" />
  </svg>
);

const PACKETS: { x: number; y: number; dx: number; dy: number; c: string }[] = [
  { x: 58, y: 76, dx: 112, dy: 30, c: '#3f9a4f' },
  { x: 34, y: 103, dx: 140, dy: -8, c: '#e8b931' },
  { x: 58, y: 112, dx: 196, dy: -16, c: '#3a6fc4' },
];

/**
 * Data-Dash: messy Excel sources on the left, a Power BI report on the right. Idle, the report is
 * finished. Active, cells fly from the sheets into the report while the red errors are fixed, the
 * bars grow, the donut spins in, the sales line draws itself and revenue counts up; then the year
 * slicer flips to 2023 and the bars re-rank. Only small HTML layers move, with transform/opacity.
 */
export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const live = active && visible && !reducedMotion;

  return (
    <div className={`dd-scene${live ? ' dd-live' : ''}`}>
      {ART}
      <div className="dd-at dd-errors" style={at(10, 48, 86, 104)}>
        {ERRORS_ART}
      </div>
      {PACKETS.map((p, i) => (
        <span
          key={i}
          className="dd-at dd-packet"
          style={at(p.x, p.y, 5, 5, { '--dx': p.dx, '--dy': p.dy, '--c': p.c, '--d': `${i * 0.5}s` })}
        />
      ))}

      <div className="dd-at dd-pill" style={at(266, 30, 40, 11)} />
      <span className="dd-at dd-chip" style={at(266, 30, 40, 11)}>
        2024
      </span>
      <span className="dd-at dd-chip" style={at(266, 44, 40, 11)}>
        2023
      </span>

      <div className="dd-at dd-kpi" style={at(136, 41, 34, 12)}>
        <div className="dd-kpi__strip">
          <span>0.4M</span>
          <span>0.9M</span>
          <span>1.2M</span>
        </div>
      </div>

      {BARS.map((b, i) => (
        <div
          key={b.x}
          className="dd-at dd-bar"
          style={at(b.x, BAR_BASE - b.h, 12, b.h, { '--alt': b.alt, '--d': `${i * 0.08}s` } as Vars)}
        >
          {BAR_ART[i]}
        </div>
      ))}
      <div className="dd-at dd-donut" style={at(253, 78, 40, 40)}>
        {DONUT}
      </div>

      <div className="dd-at dd-reveal" style={at(136, 143, 168, 41)}>
        <div className="dd-reveal__cover" />
      </div>
      <span className="dd-at dd-end" style={at(297, 144, 6, 6)} />
    </div>
  );
}
