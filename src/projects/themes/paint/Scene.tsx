import { memo, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { ThemeSceneProps } from '../../theme.ts';
import { CANVAS, Chrome } from './Chrome.tsx';
import { GRID_H, GRID_W, LAYERS, PIXELATE_BLOCK, layerPixels, paintLayer } from './picture.ts';
import './paint.css';

/* ---------- scene units: the window is a 320 x 200 drawing, 1 unit = 100cqw / 320 ---------- */

const U = 100 / 320;
const u = (n: number) => `${(n * U).toFixed(3)}cqw`;
interface Pt {
  x: number;
  y: number;
}
const tr = (p: Pt) => `translate(${u(p.x)}, ${u(p.y)})`;
const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

/* ---------- the Filters menu ---------- */

const MENU_X = 94;
const MENU_Y = 30.6;
const ROW_H = 9;
const SEP_H = 4;
const MENU_ITEMS: { label: string; layer?: number; done?: string }[] = [
  { label: 'Grayscale', layer: 1, done: 'grayscale ✓' },
  { label: 'Sepia', layer: 2, done: 'sepia ✓' },
  { label: 'Invert', layer: 3, done: 'invert ✓' },
  { label: 'Pixelate', layer: 4, done: 'pixelate ✓' },
  { label: 'Blur' },
  { label: 'Sharpen' },
  { label: 'Emboss' },
  { label: 'Vignette' },
  { label: 'Reset image', layer: 0, done: 'back to the original ✓' },
];
const RESET = MENU_ITEMS.length - 1;
/** Top of a menu row, relative to the menu box. */
const rowTop = (i: number) => 1.4 + i * ROW_H + (i >= RESET ? SEP_H : 0);
const MENU_H = rowTop(RESET) + ROW_H + 1.6;
/** Menu rows the cursor picks, in order: four filters, then back to colour. */
const SEQUENCE = [0, 1, 2, 3, RESET];

const FILTERS_AT: Pt = { x: 108, y: 26.5 };
const itemAt = (i: number): Pt => ({ x: MENU_X + 30, y: MENU_Y + rowTop(i) + 5.4 });
/** Where the cursor wanders off to while a filter sweeps across. */
const WATCH_AT: Pt[] = [
  { x: 214, y: 140 },
  { x: 236, y: 122 },
  { x: 198, y: 132 },
  { x: 226, y: 146 },
  { x: 206, y: 118 },
];

const WIPE_MS = 1300;

/* ---------- idle doodling: the kid adds a couple of strokes, then hits undo ---------- */

const cellAt = ([c, r]: readonly [number, number]): Pt => ({
  x: CANVAS.x + ((c + 0.55) * CANVAS.w) / GRID_W,
  y: CANVAS.y + ((r + 0.6) * CANVAS.h) / GRID_H,
});

const STROKES: { color: string; cells: [number, number][] }[] = [
  // a bird
  { color: '#3a3836', cells: [[19, 3], [20, 2], [21, 3], [22, 2], [23, 3]] },
  // smoke out of the chimney
  { color: '#8d8a85', cells: [[16, 4], [15, 3], [16, 2], [17, 1], [17, 0]] },
  // a purple flower in the grass
  { color: '#7b52ab', cells: [[26, 21], [27, 20], [28, 21], [27, 22]] },
];
const PAINT = STROKES.flatMap((s) => s.cells.map((cell) => ({ cell, color: s.color })));
const WANDER: Pt[] = [
  { x: 178, y: 118 },
  { x: 146, y: 70 },
  { x: 236, y: 132 },
  { x: 120, y: 144 },
];
const REST: Pt = { x: 226, y: 112 };

const READY = 'Ready · pencil tool';

/* ---------- the pixel-arrow cursor ---------- */

const ARROW = [
  'X........',
  'XX.......',
  'XoX......',
  'XooX.....',
  'XoooX....',
  'XooooX...',
  'XoooooX..',
  'XooooooX.',
  'XoooooooX',
  'XooXoXXXX',
  'XoX.XoX..',
  'XX..XoX..',
  'X....XoX.',
  '.....XoX.',
  '......X..',
];
const arrowPath = (ch: string) =>
  ARROW.flatMap((row, y) =>
    [...row].map((c, x) => (c === ch ? `M${x} ${y}h1v1h-1z` : '')),
  ).join('');
const ARROW_INK = arrowPath('X');
const ARROW_FILL = arrowPath('o');

/* ---------- the picture layers: painted once, then only shown / hidden / wiped ---------- */

let pixelsCache: ReturnType<typeof layerPixels> | null = null;

const Layers = memo(function Layers({ under, over }: { under: number; over: number | null }) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useLayoutEffect(() => {
    pixelsCache ??= layerPixels();
    refs.current.forEach((cv, i) => {
      const px = pixelsCache?.[i];
      if (cv && px) paintLayer(cv, px, LAYERS[i]?.id === 'pixelate' ? PIXELATE_BLOCK : 1);
    });
  }, []);
  return (
    <>
      {LAYERS.map((l, i) => (
        <div
          key={l.id}
          className={`pt-layer${i === under ? ' pt-layer--under' : ''}${i === over ? ' pt-layer--over' : ''}`}
        >
          <canvas
            ref={(el) => {
              refs.current[i] = el;
            }}
          />
        </div>
      ))}
    </>
  );
});

/* ---------- a tiny cancellable script runner ---------- */

class Stopped extends Error {}

function makeRunner() {
  let dead = false;
  const timers = new Set<number>();
  return {
    sleep: (ms: number) =>
      new Promise<void>((resolve, reject) => {
        if (dead) return reject(new Stopped());
        const id = window.setTimeout(() => {
          timers.delete(id);
          if (dead) reject(new Stopped());
          else resolve();
        }, ms);
        timers.add(id);
      }),
    stop: () => {
      dead = true;
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    },
  };
}

interface LayerState {
  under: number;
  over: number | null;
}

/* ---------- the scene ---------- */

/** BMP Image Editor: a home-made 90s paint program, drawn in crayon. */
export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const uid = `pt${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const clickRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<Pt>(REST);

  const [layers, setLayersState] = useState<LayerState>({ under: 0, over: null });
  const layersRef = useRef(layers);
  const wipeEndRef = useRef(0);
  const [menu, setMenu] = useState<{ open: boolean; hover: number }>({ open: false, hover: -1 });
  const [status, setStatus] = useState(READY);
  const [painted, setPaintedState] = useState(reducedMotion ? PAINT.length : 0);
  const paintedRef = useRef(painted);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const cursor = cursorRef.current;
    if (!root || !cursor) return;

    const setLayers = (l: LayerState) => {
      layersRef.current = l;
      setLayersState(l);
    };
    const setPainted = (n: number) => {
      paintedRef.current = n;
      setPaintedState(n);
    };
    const commit = () => {
      const l = layersRef.current;
      if (l.over !== null) setLayers({ under: l.over, over: null });
    };
    const livePos = (): Pt => {
      const t = getComputedStyle(cursor).transform;
      const k = root.clientWidth / 320;
      if (!t || t === 'none' || !k) return posRef.current;
      const m = new DOMMatrixReadOnly(t);
      return { x: m.m41 / k, y: m.m42 / k };
    };
    const place = (p: Pt) => {
      cursor.getAnimations().forEach((a) => a.cancel());
      posRef.current = p;
      cursor.style.transform = tr(p);
    };

    if (reducedMotion) {
      // a calm, finished frame: original picture, the kid's strokes done, cursor resting
      place(REST);
      setLayers({ under: 0, over: null });
      setMenu({ open: false, hover: -1 });
      setStatus(READY);
      setPainted(PAINT.length);
      setFading(false);
      return;
    }
    if (!visible) {
      // off screen: finish any half-done sweep instantly, and stop
      commit();
      return;
    }

    const run = makeRunner();
    const { sleep } = run;

    const move = (to: Pt, ms: number, easing = 'cubic-bezier(0.45, 0, 0.25, 1)') => {
      const from = livePos();
      place(to);
      if (ms > 0) cursor.animate([{ transform: tr(from) }, { transform: tr(to) }], { duration: ms, easing });
      return sleep(ms);
    };
    const click = () => {
      clickRef.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.78)' }, { transform: 'scale(1)' }], {
        duration: 220,
        easing: 'ease-out',
      });
      const ripple = rippleRef.current;
      if (ripple) {
        ripple.style.transform = tr(posRef.current);
        ripple.firstElementChild?.animate(
          [
            { opacity: 0.85, transform: 'scale(0.25)' },
            { opacity: 0, transform: 'scale(1)' },
          ],
          { duration: 480, easing: 'ease-out' },
        );
      }
      return sleep(170);
    };
    const wipe = (to: number) => {
      setLayers({ under: layersRef.current.under, over: to });
      wipeEndRef.current = performance.now() + WIPE_MS;
    };
    const settleWipe = async () => {
      if (layersRef.current.over === null) return;
      await sleep(Math.max(0, wipeEndRef.current - performance.now()));
      commit();
    };

    const idle = async () => {
      setMenu((m) => ({ open: false, hover: m.hover }));
      await settleWipe();
      if (layersRef.current.under !== 0) {
        setStatus('Filters › Reset image…');
        wipe(0);
        await move(WANDER[0]!, 1000);
        await sleep(WIPE_MS - 1000);
        commit();
      }
      setStatus(READY);
      if (paintedRef.current > 0) {
        setFading(true);
        await sleep(800);
        setPainted(0);
        setFading(false);
      }
      for (let lap = 0; ; lap++) {
        await move(WANDER[lap % 2]!, 1500);
        await sleep(600);
        for (let s = 0; s < STROKES.length; s++) {
          const stroke = STROKES[s]!;
          const first = PAINT.findIndex((p) => p.color === stroke.color);
          await move(cellAt(stroke.cells[0]!), 1200);
          await sleep(200);
          setStatus('drawing…');
          await click();
          setPainted(first + 1);
          for (let k = 1; k < stroke.cells.length; k++) {
            await move(cellAt(stroke.cells[k]!), 170, 'linear');
            setPainted(first + k + 1);
          }
          setStatus(READY);
          await sleep(700);
          await move(WANDER[(s + lap + 1) % WANDER.length]!, 1400);
          await sleep(900);
        }
        await sleep(1400);
        setStatus('Ctrl+Z · undo, undo, undo');
        setFading(true);
        await sleep(1000);
        setPainted(0);
        setFading(false);
        setStatus(READY);
        await sleep(500);
      }
    };

    const filters = async () => {
      if (paintedRef.current > 0) setFading(true);
      await settleWipe();
      const under = layersRef.current.under;
      let step = under === 0 ? 0 : SEQUENCE.indexOf(under);
      for (;;) {
        const item = SEQUENCE[step % SEQUENCE.length]!;
        const entry = MENU_ITEMS[item]!;
        await move(FILTERS_AT, 700);
        await click();
        if (paintedRef.current > 0) {
          setPainted(0);
          setFading(false);
        }
        setMenu({ open: true, hover: -1 });
        await sleep(260);
        setMenu({ open: true, hover: item });
        await move(itemAt(item), 560);
        await sleep(180);
        await click();
        setMenu({ open: false, hover: item });
        setStatus(`Filters › ${entry.label}…`);
        wipe(entry.layer ?? 0);
        await move(WATCH_AT[step % WATCH_AT.length]!, 1000);
        await sleep(WIPE_MS - 1000 + 40);
        commit();
        setStatus(entry.done ?? READY);
        await sleep(1100);
        step++;
      }
    };

    (active ? filters : idle)().catch((e: unknown) => {
      if (!(e instanceof Stopped)) throw e;
    });
    return () => {
      run.stop();
      // freeze the cursor where it is, so the next script starts from there
      const p = livePos();
      place(p);
    };
  }, [active, visible, reducedMotion]);

  const live = visible && !reducedMotion;
  const cls = [
    'pt-scene',
    active && !reducedMotion && 'pt-is-active',
    !live && 'pt-is-paused',
    reducedMotion && 'pt-is-still',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={rootRef} className={cls}>
      <Chrome uid={uid} />

      {/* the picture */}
      <div
        className="pt-canvas"
        style={{
          left: pct(CANVAS.x, 320),
          top: pct(CANVAS.y, 200),
          width: pct(CANVAS.w, 320),
          height: pct(CANVAS.h, 200),
        }}
      >
        <Layers under={layers.under} over={layers.over} />
        <div className={`pt-scan${layers.over !== null ? ' pt-scan--on' : ''}`}>
          <i />
        </div>

        <div className={`pt-paint${fading ? ' pt-paint--fade' : ''}`}>
          {PAINT.slice(0, painted).map(({ cell: [c, r], color }) => (
            <span
              key={`${c}-${r}`}
              style={
                {
                  left: pct(c, GRID_W),
                  top: pct(r, GRID_H),
                  width: pct(1, GRID_W),
                  height: pct(1, GRID_H),
                  '--c': color,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {/* marching ants around the sun */}
        <div className="pt-select" style={{ left: pct(34.6, GRID_W), top: pct(0.45, GRID_H), width: pct(10.8, GRID_W), height: pct(11.2, GRID_H) }}>
          <i className="pt-ants pt-ants--t">
            <b />
          </i>
          <i className="pt-ants pt-ants--r">
            <b />
          </i>
          <i className="pt-ants pt-ants--b">
            <b />
          </i>
          <i className="pt-ants pt-ants--l">
            <b />
          </i>
        </div>
      </div>

      {/* Filters menu: pressed label + drop-down */}
      <div className={`pt-menu-press${menu.open ? ' pt-on' : ''}`} style={{ left: u(MENU_X), top: u(20.4), width: u(31), height: u(9.6) }} />
      <div
        className={`pt-menu${menu.open ? ' pt-on' : ''}`}
        style={{ left: u(MENU_X), top: u(MENU_Y), width: u(70), height: u(MENU_H) }}
      >
        <div
          className={`pt-menu-hi${menu.hover >= 0 ? ' pt-on' : ''}`}
          style={{ top: 0, height: u(ROW_H), transform: `translateY(${u(rowTop(Math.max(0, menu.hover)))})` }}
        />
        {MENU_ITEMS.map((m, i) => (
          <span key={m.label} className="pt-menu-item" style={{ top: u(rowTop(i)), height: u(ROW_H) }}>
            {m.label}
            {m.layer === undefined && '…'}
          </span>
        ))}
        <span className="pt-menu-sep" style={{ top: u(rowTop(RESET) - SEP_H / 2 - 0.3) }} />
      </div>

      {/* status bar */}
      <div className="pt-status" style={{ left: u(11), top: u(187.4), height: u(7.6) }}>
        {status}
      </div>

      {/* click ripple + cursor */}
      <div ref={rippleRef} className="pt-ripple">
        <i />
      </div>
      <div ref={cursorRef} className="pt-cursor" style={{ transform: tr(REST) }}>
        <div ref={clickRef} className="pt-cursor-inner">
          <svg viewBox="0 0 9 15" shapeRendering="crispEdges" focusable="false">
            <path d={ARROW_FILL} fill="#fdfcf7" />
            <path d={ARROW_INK} fill="#2c2a28" />
          </svg>
        </div>
      </div>
    </div>
  );
}
