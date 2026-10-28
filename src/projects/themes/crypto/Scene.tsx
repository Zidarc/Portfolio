import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createRng } from '../../../crayon/random.ts';
import type { ThemeSceneProps } from '../../theme.ts';
import {
  Backdrop,
  Block,
  BLOCK_COLORS,
  CheckBadge,
  CoinFace,
  COIN_TH,
  Flame,
  GROUND_Y,
  Puff,
  Rocket,
  SharedDefs,
  SlipPaper,
  StackCoinSvg,
  Star,
  STARS,
  SYMBOLS,
  TOWERS,
  WalletFront,
  type Ids,
} from './art.tsx';
import './crypto.css';

/** Place a box in scene units (the window is 320 x 200; CSS turns these into cqw). */
const at = (x: number, y: number, w: number, h: number, extra: Record<string, string | number> = {}) =>
  ({ '--x': x, '--y': y, '--w': w, '--h': h, ...extra }) as CSSProperties;

/* ---------- the pump: coins raining into a pile ---------- */

interface Drop {
  x: number;
  y: number;
  sym: (typeof SYMBOLS)[number];
  style: CSSProperties;
}

const DROPS: Drop[] = (() => {
  const rng = createRng(11);
  // front rows lie in front of the piggy bank, the top ones heap up beside it
  const rows = [
    { y: 190, xs: [106, 118, 130, 142, 154, 166, 178], d: [0.05, 0.6] },
    { y: 185, xs: [112, 124, 136, 148, 160, 172], d: [0.5, 1.1] },
    { y: 180, xs: [104, 118, 166, 177], d: [1.0, 1.55] },
    { y: 175, xs: [109, 121], d: [1.5, 1.9] },
  ];
  const out: Drop[] = [];
  rows.forEach((row, ri) => {
    row.xs.forEach((x0, i) => {
      const x = x0 + (rng() * 2 - 1) * 1.6;
      const y = row.y + (rng() * 2 - 1) * 0.8;
      const delay = row.d[0]! + rng() * (row.d[1]! - row.d[0]!);
      out.push({
        x,
        y,
        sym: SYMBOLS[(i + ri * 3) % SYMBOLS.length]!,
        style: at(x - 8.5, y - 8.5, 17, 17, {
          '--fall': (y + 22).toFixed(1),
          '--dx': ((rng() * 2 - 1) * 14).toFixed(1),
          '--r': `${((rng() * 2 - 1) * 14).toFixed(1)}deg`,
          '--r0': `${((rng() * 2 - 1) * 40).toFixed(1)}deg`,
          '--d': `${delay.toFixed(2)}s`,
          zIndex: ri,
        }),
      });
    });
  });
  return out;
})();

/** After the big rain, a few coins keep trickling onto the pile (and vanish into it). */
const TRICKLE = [0, 1, 2].map((i) => {
  const x = 134 + i * 11;
  return at(x - 6.5, 172 - 6.5, 13, 13, {
    '--fall': 194,
    '--d': `${(2.3 + i * 0.47).toFixed(2)}s`,
    '--r0': `${i * 50 - 40}deg`,
  });
});

/** Smoke at the pad, then a dotted trail up toward the moon. */
const PAD_PUFFS = [
  { x: 184, y: 167, dx: -9, d: 0.25 },
  { x: 199, y: 168, dx: 9, d: 0.32 },
  { x: 191, y: 170, dx: -3, d: 0.45 },
  { x: 178, y: 171, dx: -14, d: 0.55 },
];
const TRAIL = [
  { x: 199, y: 120, d: 0.85, s: 7 },
  { x: 207, y: 102, d: 1.08, s: 6.5 },
  { x: 217, y: 86, d: 1.3, s: 6 },
  { x: 229, y: 72, d: 1.52, s: 5.4 },
  { x: 240, y: 61, d: 1.74, s: 4.8 },
];

/* ---------- the wallet balance ---------- */

const OPEN = 1204.37;
const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => {
  const p = (v / OPEN - 1) * 100;
  const n = Math.abs(p) >= 100 ? Math.round(Math.abs(p)).toString() : Math.abs(p).toFixed(1);
  return { text: `${p >= 0 ? '▲ +' : '▼ −'}${n}%`, up: p >= 0 };
};

/* ---------- blockchain ---------- */

const FIRST_BLOCK = 1037;
const INITIAL_BLOCKS = 8;
const BLOCK_STEP = 33;
const BLOCKS_SHOWN = 7;

/** Negotium: Cedar College's crypto-coin trading floor, as a night sky full of crayon coins. */
export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const uid = `cr${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const ids = useMemo<Ids>(
    () => ({ gold: `${uid}-gold`, goldDark: `${uid}-golddk`, rough: `${uid}-rough`, sky: `${uid}-sky` }),
    [uid],
  );

  const still = reducedMotion;

  /* the pump layer mounts on each hover (fresh animations) and fades out after */
  const [pumpKey, setPumpKey] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (still) {
      setPumpKey(0);
      setLeaving(false);
      return;
    }
    if (active) {
      setLeaving(false);
      setPumpKey((k) => k + 1);
      return;
    }
    setLeaving(true);
    const t = window.setTimeout(() => {
      setPumpKey(0);
      setLeaving(false);
    }, 700);
    return () => window.clearTimeout(t);
  }, [active, still]);

  /* a new block joins the chain shortly after the pump starts, then every few seconds */
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  useEffect(() => {
    if (still || !active || !visible) return;
    const add = () => setBlocks((n) => n + 1);
    const first = window.setTimeout(add, 950);
    const every = window.setInterval(add, 3400);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [active, visible, still]);

  /* balance: drifts while idle, rockets up on a pump, then slowly dumps back */
  const numRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const balRef = useRef({ v: OPEN * 1.032, target: OPEN * 1.032, wasActive: false });

  useEffect(() => {
    const num = numRef.current;
    const pct = pctRef.current;
    if (!num || !pct) return;
    const b = balRef.current;
    let shown = '';
    let shownPct = '';
    const write = (v: number) => {
      const s = fmt(v);
      if (s !== shown) num.textContent = shown = s;
      const p = fmtPct(v);
      if (p.text !== shownPct) {
        pct.textContent = shownPct = p.text;
        pct.className = `cr-slip__pct ${p.up ? 'cr-up' : 'cr-down'}`;
      }
    };

    if (still) {
      b.v = b.target = OPEN * 1.032;
      write(b.v);
      return;
    }
    write(b.v);
    if (!visible) return;

    const rng = Math.random;
    let raf = 0;
    let last = performance.now();
    let nextStep = last + 1400;
    let lastWrite = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const act = activeRef.current;
      if (act && !b.wasActive) {
        // the pump: 6-8x in a couple of seconds
        b.target = Math.min(98_000, Math.max(b.v, OPEN) * (6.4 + rng() * 1.6));
        nextStep = now + 2300;
      }
      b.wasActive = act;
      if (now >= nextStep) {
        if (act) {
          b.target *= 1.004 + rng() * 0.01;
          nextStep = now + 650;
        } else {
          // idle: a random walk that slowly pulls back toward the opening price
          const home = OPEN * 1.03;
          b.target += (home - b.target) * 0.45 + (rng() * 2 - 1) * b.target * 0.006;
          nextStep = now + 1300;
        }
        b.target = Math.min(99_000, b.target);
      }
      const rate = act ? 1.6 : 1.2;
      b.v += (b.target - b.v) * (1 - Math.exp(-dt * rate));
      if (now - lastWrite > 55) {
        lastWrite = now;
        write(b.v);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [visible, still]);

  const pumped = pumpKey > 0 && !still;
  const firstShown = Math.max(0, blocks - BLOCKS_SHOWN - 1);
  const shift = -(blocks - BLOCKS_SHOWN) * BLOCK_STEP;

  const cls = [
    'cr-scene',
    pumped && !leaving && 'cr-is-pumped',
    pumped && 'cr-has-pump',
    !visible && 'cr-is-paused',
    still && 'cr-is-still',
  ]
    .filter(Boolean)
    .join(' ');

  const midTower = TOWERS[1]!;
  const towerTopY = GROUND_Y - 4 - (midTower.n - 1) * COIN_TH;

  return (
    <div className={cls}>
      <SharedDefs ids={ids} />
      <div className="cr-moonglow" />
      <Backdrop ids={ids} />

      {STARS.slice(0, 6).map((s, i) => (
        <div
          key={i}
          className="cr-at cr-twinkle"
          style={at(s.x - 5, s.y - 5, 10, 10, { '--t': `${3 + i * 0.7}s`, '--td': `${-i * 1.3}s` })}
        >
          <Star big={s.big} />
        </div>
      ))}

      {/* blockchain */}
      <div className="cr-at cr-chain" style={at(4, 4, 238, 34)}>
        <div className="cr-chain__track" style={{ transform: `translateX(calc(${shift} * var(--u)))` }}>
          {Array.from({ length: blocks - firstShown }, (_, k) => {
            const i = firstShown + k;
            const fresh = i >= INITIAL_BLOCKS;
            const newest = i === blocks - 1;
            return (
              <div
                key={i}
                className={`cr-at cr-block${fresh ? ' cr-block--fresh' : ''}`}
                style={at(i * BLOCK_STEP, 2, 37, 30)}
              >
                <Block n={FIRST_BLOCK + i} color={BLOCK_COLORS[i % BLOCK_COLORS.length]!} ids={ids} />
                {newest && (
                  <div className={`cr-at cr-badge${fresh ? ' cr-badge--pop' : ''}`} style={at(26, -2, 13, 13)}>
                    <CheckBadge ids={ids} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* the big NEGO coin, floating and spinning */}
      <div className="cr-at cr-hero" style={at(118, 64, 56, 56)}>
        <div className="cr-spin cr-spin--hero">
          <CoinFace sym="NEGO" ids={ids} />
        </div>
      </div>

      {/* coins around the towers */}
      <div className="cr-at cr-hop" style={at(midTower.x - 13, towerTopY - 5, 26, 13)}>
        <StackCoinSvg ids={ids} />
      </div>
      <div className="cr-at cr-lean" style={at(83, 153, 24, 24)}>
        <div className="cr-spin cr-spin--b">
          <CoinFace sym="CEDR" ids={ids} />
        </div>
      </div>
      <div className="cr-at cr-lean cr-lean--waxx" style={at(-2, 162, 19, 19)}>
        <div className="cr-spin cr-spin--c">
          <CoinFace sym="WAXX" ids={ids} />
        </div>
      </div>
      <div className="cr-at cr-lean cr-lean--cryn" style={at(56, 166, 15, 15)}>
        <div className="cr-spin cr-spin--d">
          <CoinFace sym="CRYN" ids={ids} />
        </div>
      </div>

      {/* rocket waiting on its pad */}
      <div className="cr-at cr-rocket cr-rocket--pad" style={at(186, 128, 20, 46)}>
        <Rocket ids={ids} />
      </div>

      {/* wallet */}
      <div className="cr-at cr-slip" style={at(219, 74, 83, 64)}>
        <SlipPaper ids={ids} />
        <span className="cr-slip__label">my wallet</span>
        <span className="cr-slip__num" ref={numRef} />
        <span className="cr-slip__unit">NEGO</span>
        <span className="cr-slip__pct cr-up" ref={pctRef} />
      </div>
      <div className="cr-at cr-wallet" style={at(213, 124, 98, 54)}>
        <WalletFront ids={ids} />
      </div>

      {pumped && (
        <div key={pumpKey} className={`cr-pump${leaving ? ' cr-pump--leaving' : ''}`}>
          {PAD_PUFFS.map((p, i) => (
            <div
              key={`p${i}`}
              className="cr-at cr-puff"
              style={at(p.x, p.y, 14, 12, { '--dx': p.dx, '--d': `${p.d}s` })}
            >
              <Puff ids={ids} seed={300 + i} />
            </div>
          ))}
          {TRAIL.map((p, i) => (
            <div
              key={`t${i}`}
              className="cr-at cr-trail"
              style={at(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s, { '--d': `${p.d}s` })}
            >
              <Puff ids={ids} seed={320 + i} />
            </div>
          ))}

          <div className="cr-at cr-rocket cr-rocket--fly" style={at(186, 128, 20, 46)}>
            <div className="cr-flame">
              <Flame />
            </div>
            <Rocket ids={ids} />
          </div>

          <div className="cr-at cr-moonnote" style={at(160, 48, 86, 22)}>
            <svg viewBox="0 0 86 22" focusable="false">
              <text x="2" y="14" className="cr-moonnote__text">
                to the moon!
              </text>
              <path d="M8 18.5Q40 21.5 74 16.5" className="cr-moonnote__line" />
            </svg>
          </div>

          {DROPS.map((d, i) => (
            <div key={`d${i}`} className="cr-at cr-drop" style={d.style}>
              <div className="cr-drop__coin">
                <CoinFace sym={d.sym} ids={ids} />
              </div>
            </div>
          ))}
          {TRICKLE.map((s, i) => (
            <div key={`k${i}`} className="cr-at cr-trickle" style={s}>
              <div className="cr-trickle__coin">
                <CoinFace sym={SYMBOLS[i]!} ids={ids} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
