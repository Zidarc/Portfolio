import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createRng } from '../../../crayon/random.ts';
import type { ThemeSceneProps } from '../../theme.ts';
import { CHART, Market, SLOTS, wobblyLine, wobblyRect, type TickKind } from './market.ts';
import './Scene.css';

/* ---------- made-up exchange ---------- */

const TICKER: { sym: string; chg: number }[] = [
  { sym: 'SYN', chg: 2.4 },
  { sym: 'IBA', chg: -0.8 },
  { sym: 'CRAY', chg: 5.1 },
  { sym: 'DOOD', chg: -1.2 },
  { sym: 'WAXY', chg: 0.6 },
  { sym: 'GRPH', chg: 3.3 },
  { sym: 'KIDZ', chg: -2.0 },
  { sym: 'MOON', chg: 9.9 },
];
const SLOT = 68;
const TICKER_W = TICKER.length * SLOT;
const TICKER_X = 80;

interface Team {
  id: string;
  name: string;
  color: string;
  /** How hard the team leans into the market (negative = they were shorting). */
  beta: number;
  v: number;
}

const TEAMS: Team[] = [
  { id: 'bulls', name: 'Bulls', color: 'var(--crayon-green)', beta: 1.2, v: 12.4 },
  { id: 'rockets', name: 'Rockets', color: 'var(--crayon-orange)', beta: 1.6, v: 11.8 },
  { id: 'owls', name: 'Owls', color: 'var(--crayon-purple)', beta: 0.4, v: 10.9 },
  { id: 'bears', name: 'Bears', color: 'var(--crayon-red)', beta: -0.8, v: 10.1 },
];

interface Board {
  teams: Team[];
  /** team ids, best first */
  order: string[];
  /** -1 moved up, 1 moved down, 0 stayed, since the last tick */
  moved: Record<string, number>;
  /** last direction each team moved, so a fading arrow keeps its colour */
  dir: Record<string, number>;
  tick: number;
}

const rankOf = (teams: Team[]) => [...teams].sort((a, b) => b.v - a.v).map((t) => t.id);

const INITIAL_BOARD: Board = { teams: TEAMS, order: rankOf(TEAMS), moved: {}, dir: {}, tick: 0 };

function nextBoard(b: Board, pct: number, kind: TickKind, dice: number[]): Board {
  let d = 0;
  const rng = () => dice[d++ % dice.length] ?? 0.5;
  const noise = kind === 'idle' ? 0.002 : 0.02;
  const teams = b.teams.map((t) => ({ ...t, v: t.v * (1 + (pct / 100) * t.beta + (rng() - 0.5) * noise) }));
  if (kind !== 'idle' && rng() < 0.85) {
    // trading frenzy: someone climbs past the team above them
    const ord = rankOf(teams);
    const r = 1 + Math.floor(rng() * (ord.length - 1));
    const climber = teams.find((t) => t.id === ord[r])!;
    const above = teams.find((t) => t.id === ord[r - 1])!;
    climber.v = above.v * (1.004 + rng() * 0.02);
  }
  const order = rankOf(teams);
  const moved: Record<string, number> = {};
  const dir = { ...b.dir };
  for (const id of order) {
    moved[id] = Math.sign(order.indexOf(id) - b.order.indexOf(id));
    if (moved[id]) dir[id] = moved[id];
  }
  return { teams, order, moved, dir, tick: b.tick + 1 };
}

/* ---------- static crayon bits, drawn once ---------- */

const STATIC = (() => {
  const rng = createRng(42);
  return {
    yAxis: wobblyLine([[16, 184], [16, 36]], rng, 0.5) + wobblyLine([[12.5, 41], [16, 35], [19.5, 41.5]], rng, 0.2),
    xAxis: wobblyLine([[13, 184], [214, 184]], rng, 0.5) + wobblyLine([[208.5, 180.5], [214.5, 184], [208.5, 187.5]], rng, 0.2),
    tapeEdge: wobblyLine([[0, 22.5], [320, 22.5]], rng, 0.6),
    labelEdge: wobblyLine([[73, 1], [73, 22]], rng, 0.5),
    labelUnder: wobblyLine([[9, 18.5], [65, 18]], rng, 0.4),
    card: wobblyRect(220, 92, 314, 188, Array.from({ length: 10 }, () => rng() * 2 - 1)),
    titleUnder: wobblyLine([[228, 108], [290, 107.3]], rng, 0.4),
  };
})();

const ROW_Y = 121;
const ROW_H = 17;

/* ---------- imperative painting (60fps work stays out of React) ---------- */

interface Els {
  candles: { g: SVGGElement; wick: SVGPathElement; halo: SVGPathElement; body: SVGPathElement }[];
  ticker: SVGGElement;
  synChg: SVGTSpanElement[];
  price: SVGTextElement;
  pct: SVGTextElement;
  priceLine: SVGPathElement;
  note: SVGGElement;
  noteText: SVGTextElement;
}

function collect(svg: SVGSVGElement): Els {
  const q = <T extends Element>(sel: string) => svg.querySelector(sel) as T;
  return {
    candles: [...svg.querySelectorAll<SVGGElement>('[data-c]')].map((g) => ({
      g,
      wick: g.querySelector('.stk-wick') as SVGPathElement,
      halo: g.querySelector('.stk-halo') as SVGPathElement,
      body: g.querySelector('.stk-body') as SVGPathElement,
    })),
    ticker: q('[data-ticker]'),
    synChg: [...svg.querySelectorAll<SVGTSpanElement>('[data-syn]')],
    price: q('[data-price]'),
    pct: q('[data-pct]'),
    priceLine: q('[data-pline]'),
    note: q('[data-note]'),
    noteText: q('[data-note] text'),
  };
}

interface Anim {
  offset: number;
  speed: number;
  intro: number;
  flash: '' | 'up' | 'down';
  flashUntil: number;
  note: '' | 'up' | 'down';
  noteUntil: number;
  painted: { lo: number; hi: number; shift: number; intro: number };
}

const setAttr = (el: Element, name: string, value: string) => {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
};
const setText = (el: Element, value: string) => {
  if (el.textContent !== value) el.textContent = value;
};
const fmtPct = (p: number) => `${p >= 0 ? '▲' : '▼'}${Math.abs(p).toFixed(1)}%`;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

function paint(els: Els, m: Market, a: Anim, uid: string, now: number, wiggle: number) {
  const p = a.painted;
  // only the live candle changes on a quiet frame; repaint the whole row when it slides or rescales
  const all = m.shift > 0 || p.shift > 0 || a.intro < 1 || p.intro < 1 || Math.abs(m.lo - p.lo) + Math.abs(m.hi - p.hi) > m.ref * 1e-4;
  const lastIdx = SLOTS - 1;
  let liveX = 0;
  let liveTop = 0;

  for (let i = all ? 0 : lastIdx; i < SLOTS; i++) {
    const c = m.candles[i];
    const el = els.candles[i];
    if (!c || !el) continue;
    const x = CHART.left + (i - 1 + m.shift) * CHART.spacing;
    const appear = i === 0 ? 1 : easeOut(Math.min(1, Math.max(0, a.intro * 14 - (i - 1))));
    const yo = m.y(c.o);
    const yc = yo + (m.y(c.c) + (i === lastIdx ? wiggle : 0) - yo) * appear;
    const yh = yo + (m.y(c.h) - yo) * appear;
    const yl = yo + (m.y(c.l) - yo) * appear;
    let top = Math.min(yo, yc);
    let bot = Math.max(yo, yc);
    if (bot - top < 1.6) {
      const mid = (top + bot) / 2;
      top = mid - 0.8;
      bot = mid + 0.8;
    }
    const up = c.c >= c.o;
    const j = c.jit;
    const half = CHART.body / 2;
    const body = wobblyRect(x - half, top, x + half, bot, j);
    const wx = x + (j[9] ?? 0) * 0.5;
    setAttr(el.g, 'class', `stk-candle ${up ? 'stk-up' : 'stk-down'}`);
    setAttr(el.g, 'opacity', appear > 0 ? '1' : '0');
    setAttr(el.body, 'fill', `url(#${uid}-${up ? 'up' : 'dn'})`);
    setAttr(el.body, 'd', body);
    setAttr(el.halo, 'd', body);
    setAttr(
      el.wick,
      'd',
      `M${x.toFixed(1)} ${Math.min(yh, top).toFixed(1)}L${wx.toFixed(1)} ${((top + bot) / 2).toFixed(1)}L${x.toFixed(1)} ${Math.max(yl, bot).toFixed(1)}`,
    );
    if (i === lastIdx) {
      liveX = x;
      liveTop = Math.min(yh, top);
      // dashed "you are here" line from the live close to the price
      setAttr(els.priceLine, 'd', `M${(x + half + 3).toFixed(1)} ${yc.toFixed(1)}H213`);
      setAttr(els.priceLine, 'class', `stk-pline ${up ? 'stk-up' : 'stk-down'}`);
    }
  }
  p.lo = m.lo;
  p.hi = m.hi;
  p.shift = m.shift;
  p.intro = a.intro;

  const price = m.ref + (m.shown - m.ref) * easeOut(a.intro);
  const pct = (price / m.ref - 1) * 100;
  setText(els.price, price.toFixed(2));
  setText(els.pct, `${pct >= 0 ? '▲ +' : '▼ −'}${Math.abs(pct).toFixed(2)}%`);
  setAttr(els.pct, 'class', `stk-pct ${pct >= 0 ? 'stk-up' : 'stk-down'}`);
  const flash = now < a.flashUntil ? a.flash : '';
  setAttr(els.price, 'class', `stk-price${flash ? ` stk-flash-${flash}` : ''}`);

  for (const t of els.synChg) {
    setText(t, fmtPct(pct));
    setAttr(t, 'class', pct >= 0 ? 'stk-up' : 'stk-down');
  }
  setAttr(els.ticker, 'transform', `translate(${(-a.offset).toFixed(2)} 0)`);

  const note = now < a.noteUntil ? a.note : '';
  setAttr(els.note, 'class', `stk-note${note ? ` stk-note--on stk-${note === 'up' ? 'up' : 'down'}` : ''}`);
  if (note) {
    setText(els.noteText, note === 'up' ? 'to the moon!' : 'uh oh!');
    const ny = Math.max(54, liveTop - 4);
    setAttr(els.note, 'transform', `translate(${(liveX - 9).toFixed(1)} ${ny.toFixed(1)})`);
  }
}

/* ---------- the scene ---------- */

export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const uid = `stk${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const marketRef = useRef<Market | null>(null);
  const animRef = useRef<Anim>({
    offset: 0,
    speed: 11,
    intro: 0,
    flash: '',
    flashUntil: 0,
    note: '',
    noteUntil: 0,
    painted: { lo: 0, hi: 0, shift: 1, intro: 0 },
  });
  const activeRef = useRef(active);
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    marketRef.current ??= new Market(7);
    const m = marketRef.current;
    const a = animRef.current;
    const els = collect(svg);

    if (reducedMotion) {
      // a still, finished frame: chart fully drawn, nothing scrolling or reshuffling
      m.settle();
      a.intro = 1;
      a.offset = 0;
      a.flashUntil = a.noteUntil = 0;
      a.painted.intro = 0;
      paint(els, m, a, uid, 0, 0);
      return;
    }

    // asleep boxes show a still frame, so it should be a finished chart rather than an empty one
    if (!visible) a.intro = 1;
    paint(els, m, a, uid, performance.now(), 0);
    if (!visible) return;

    let raf = 0;
    let last = performance.now();
    let nextTick = last + 1600;
    let wasActive = false;
    let lastTick = 0;

    const tick = (kind: TickKind, now: number) => {
      lastTick = now;
      const pct = m.tick(kind);
      if (kind !== 'idle' || Math.abs(pct) > 0.35) {
        a.flash = pct >= 0 ? 'up' : 'down';
        a.flashUntil = now + 650;
      }
      if (kind === 'kick' || (kind === 'active' && Math.abs(pct) > 2.6)) {
        a.note = pct >= 0 ? 'up' : 'down';
        a.noteUntil = now + 1700;
      }
      // roll the dice out here so the state updater stays pure (StrictMode may call it twice)
      const dice = Array.from({ length: 8 }, () => m.rng());
      setBoard((b) => nextBoard(b, pct, kind, dice));
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const act = activeRef.current;
      // ticks are at least ~1s apart (hover flicking included), so flashes stay well under 3 per second
      if (act && !wasActive && a.intro >= 1 && now - lastTick > 1000) {
        tick('kick', now);
        nextTick = now + 1100;
      } else if (now >= nextTick) {
        tick(act ? 'active' : 'idle', now);
        nextTick = now + (act ? 1100 : 2400);
      }
      if (a.intro >= 1) wasActive = act;

      a.speed += ((act ? 46 : 11) - a.speed) * (1 - Math.exp(-dt * 2.5));
      a.offset = (a.offset + a.speed * dt) % TICKER_W;
      a.intro = Math.min(1, a.intro + dt / 1.3);
      m.step(dt);
      const t = now / 1000;
      const wiggle = (Math.sin(t * 2.3) * 1.1 + Math.sin(t * 5.1) * 0.5) * (act ? 0.5 : 1);
      paint(els, m, a, uid, now, wiggle);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [visible, reducedMotion, uid]);

  const live = active && visible && !reducedMotion;
  const tickerCopy = (copy: number) =>
    TICKER.map((t, i) => (
      <text key={`${copy}-${t.sym}`} x={TICKER_X + copy * TICKER_W + i * SLOT} y={15.5} className="stk-tick">
        {t.sym}{' '}
        {t.sym === 'SYN' ? (
          <tspan data-syn="" />
        ) : (
          <tspan className={t.chg >= 0 ? 'stk-up' : 'stk-down'}>{fmtPct(t.chg)}</tspan>
        )}
        <tspan className="stk-sep" dx={6}>
          ✶
        </tspan>
      </text>
    ));

  return (
    <div className={`stk-scene${live ? ' stk-live' : ''}`}>
      <svg ref={svgRef} viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <pattern id={`${uid}-grid`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" className="stk-gridline" />
          </pattern>
          <pattern id={`${uid}-up`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <rect width="3" height="3" className="stk-fill-up" />
            <path d="M0 0V3" className="stk-hatch-up" />
          </pattern>
          <pattern id={`${uid}-dn`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="3" height="3" className="stk-fill-down" />
            <path d="M0 0V3" className="stk-hatch-down" />
          </pattern>
          <clipPath id={`${uid}-chart`}>
            <rect x={CHART.clipLeft} y="24" width={CHART.clipRight - CHART.clipLeft} height="160" />
          </clipPath>
        </defs>

        <rect width="320" height="200" fill={`url(#${uid}-grid)`} />

        {/* axes */}
        <path d={STATIC.yAxis} className="stk-axis" />
        <path d={STATIC.xAxis} className="stk-axis" />

        {/* candles */}
        <g clipPath={`url(#${uid}-chart)`}>
          <path data-pline="" className="stk-pline" />
          {Array.from({ length: SLOTS }, (_, i) => (
            <g key={i} data-c="" className="stk-candle" opacity="0">
              <path className="stk-wick" />
              <path className="stk-halo" transform="translate(0.6 0.5)" />
              <path className="stk-body" />
            </g>
          ))}
          <g data-note="" className="stk-note">
            <text textAnchor="end" x="-4" y="-6">
              to the moon!
            </text>
            <path d="M-6 -3Q-2 -1 1 2M-2.5 2.4L1 2l.2-3.4" className="stk-note-arrow" />
          </g>
        </g>

        {/* price */}
        <text x="223" y="42" className="stk-label">
          SYN · live
        </text>
        <circle cx="301" cy="38.5" r="2.6" className="stk-dot" />
        <text x="221" y="69" data-price="" className="stk-price" />
        <text x="223" y="84" data-pct="" className="stk-pct" />

        {/* leaderboard card */}
        <g className="stk-card">
          <path d={STATIC.card} className="stk-card-edge" />
          <text x="228" y="105" className="stk-card-title">
            leaderboard
          </text>
          <path d={STATIC.titleUnder} className="stk-underline" />
          {[1, 2, 3, 4].map((r) => (
            <text key={r} x="226" y={ROW_Y + (r - 1) * ROW_H} className="stk-rank">
              {r}
            </text>
          ))}
          <path d="M310 108l2 -5 2 5 2.5 -6 1.5 7z" className="stk-crown" transform="translate(-18 -1)" />
          {board.teams.map((t) => {
            const rank = board.order.indexOf(t.id);
            const moved = board.moved[t.id] ?? 0;
            const dir = board.dir[t.id] ?? 0;
            const climbing = moved < 0 && !reducedMotion;
            return (
              <g
                key={t.id}
                className={`stk-row${reducedMotion ? '' : ' stk-row--anim'}`}
                style={{ transform: `translate(0px, ${ROW_Y + rank * ROW_H}px)` }}
              >
                {/* remount on each climb so the hop animation replays */}
                <g key={climbing ? `climb-${board.tick}` : 'still'} className={climbing ? 'stk-climb' : undefined}>
                  <rect x="236" y="-11.5" width="76" height="15.5" className="stk-row-bg" />
                  <text
                    x="233"
                    y="0"
                    className={`stk-move${moved ? ' stk-move--on' : ''} ${dir < 0 ? 'stk-up' : 'stk-down'}`}
                  >
                    {dir < 0 ? '▲' : '▼'}
                  </text>
                  <text x="240" y="0" className="stk-team" style={{ fill: t.color }}>
                    {t.name}
                  </text>
                  <text x="309" y="0" textAnchor="end" className="stk-val">
                    {t.v.toFixed(1)}k
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* ticker tape */}
        <rect width="320" height="22.5" className="stk-tape" />
        <g data-ticker="">
          {tickerCopy(0)}
          {tickerCopy(1)}
        </g>
        <path d={STATIC.tapeEdge} className="stk-tape-edge" />
        <rect width="73" height="22.5" className="stk-label-box" />
        <path d={STATIC.labelEdge} className="stk-tape-edge" />
        <text x="9" y="15.5" className="stk-exchange">
          SYNERGY
        </text>
        <path d={STATIC.labelUnder} className="stk-exchange-under" />
      </svg>
    </div>
  );
}
