import { useId, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { ThemeSceneProps } from '../../theme.ts';
import { ADDR_A, ADDR_B, DISTANCE, MAP, MEASURE, PIN_A, PIN_B, WAVES, type P } from './geo.ts';
import { COMPASS, MapBase } from './MapBase.tsx';
import './maps.css';

/*
 * GeoCode: a treasure map of Karachi's coast. The map itself is one static SVG that never repaints;
 * everything that moves is a small SVG layer on top, animated with transform / opacity only.
 * The "geocoding" run is a handful of classes added to the root on a timer (no React re-renders).
 */

const STAGES = ['map-go1', 'map-go2', 'map-go3', 'map-go4', 'map-go5'] as const;
const TYPE_MS = 55;

/** A layer positioned over the map: its viewBox is the same region in map units. */
function Layer({
  x,
  y,
  w,
  h,
  className,
  style,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <svg
      className={`map-layer ${className}`}
      viewBox={`${x} ${y} ${w} ${h}`}
      focusable="false"
      style={{
        left: `${(x / 3.2).toFixed(3)}%`,
        top: `${(y / 2).toFixed(3)}%`,
        width: `${(w / 3.2).toFixed(3)}%`,
        height: `${(h / 2).toFixed(3)}%`,
        ...style,
      }}
    >
      {children}
    </svg>
  );
}

/** Teardrop pin with its tip at (0, 0). */
const PIN_D = 'M0 0C-1.6 -4.6 -6.6 -9.2 -6.6 -15A6.6 6.6 0 1 1 6.6 -15C6.6 -9.2 1.6 -4.6 0 0Z';

function Pin({ at, kind }: { at: P; kind: 'a' | 'b' }) {
  const [x, y] = at;
  return (
    <>
      <Layer x={x - 7} y={y - 3} w={14} h={6} className={`map-shadow map-shadow--${kind}`}>
        <ellipse cx={x} cy={y} rx="5.2" ry="1.9" />
      </Layer>
      <Layer x={x - 9} y={y - 24} w={18} h={25} className={`map-pin map-pin--${kind}`}>
        <g transform={`translate(${x} ${y})`}>
          <path d={PIN_D} className="map-pin-body" />
          <path d="M-3.6 -18.6Q-2.2 -20.6 0.2 -20.9" className="map-pin-shine" />
          <circle cy="-15" r="2.4" className="map-pin-hole" />
        </g>
      </Layer>
    </>
  );
}

const dotsBox = (() => {
  const xs = MEASURE.dots.map((d) => d[0]);
  const ys = MEASURE.dots.map((d) => d[1]);
  const x = Math.min(...xs) - 3;
  const y = Math.min(...ys) - 3;
  return { x, y, w: Math.max(...xs) + 3 - x, h: Math.max(...ys) + 3 - y };
})();

/** The distance tag sits just off the middle of the line, on the sea side. */
const TAG: P = [MEASURE.mid[0] + 22, MEASURE.mid[1] + 14];
/** "X marks the spot", right by the second university pin. */
const XS: P = [PIN_A[0] + 15, PIN_A[1] + 9];

export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const uid = `map${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  /** how far through the run we are: 0 idle … 5 finished */
  const progress = useRef(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const typed = typedRef.current;
    if (!root || !typed) return;
    const cls = root.classList;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const reset = () => {
      cls.remove(...STAGES, 'map-leaving');
      typed.textContent = '';
      progress.current = 0;
    };
    const stage = (n: number) => {
      cls.add(STAGES[n - 1]!);
      progress.current = n;
    };
    const type = (start: number, text: string) => {
      at(start, () => (typed.textContent = ''));
      for (let i = 1; i <= text.length; i++) at(start + i * TYPE_MS, () => (typed.textContent = text.slice(0, i)));
      return start + text.length * TYPE_MS;
    };

    cls.toggle('map-still', reducedMotion);
    cls.toggle('map-paused', !visible && !reducedMotion);

    if (reducedMotion) {
      // a calm, finished map: both pins down, the line measured, the X drawn
      cls.remove('map-leaving');
      cls.add(...STAGES);
      typed.textContent = ADDR_B;
      progress.current = STAGES.length;
      return;
    }

    if (!visible) {
      // off screen: drop anything half-done, it replays from the top next time
      if (!active || progress.current < STAGES.length) reset();
      return;
    }

    if (!active) {
      if (progress.current === 0) {
        reset();
        return;
      }
      // fade the pins, line and X away, then put the map back to idle
      cls.add('map-leaving');
      at(420, reset);
      return () => timers.forEach((id) => window.clearTimeout(id));
    }

    // active and on screen
    if (progress.current === STAGES.length && !cls.contains('map-leaving')) return;
    reset();
    stage(1);
    let t = type(250, ADDR_A);
    at(t + 260, () => stage(2)); // search → pin A drops
    t = type(t + 1200, ADDR_B);
    at(t + 260, () => stage(3)); // pin B drops
    at(t + 1150, () => stage(4)); // measure
    at(t + 1150 + MEASURE.dots.length * 45 + 650, () => stage(5)); // X marks the spot
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [active, visible, reducedMotion]);

  const [cx, cy] = COMPASS;

  return (
    <div ref={rootRef} className="map-scene">
      <MapBase uid={uid} />

      {/* surf rippling along the coast */}
      <Layer x={0} y={112} w={320} h={80} className="map-surf map-surf--1">
        <path d={MAP.surf1} />
      </Layer>
      <Layer x={0} y={112} w={320} h={80} className="map-surf map-surf--2">
        <path d={MAP.surf2} />
      </Layer>

      {/* waves out at sea */}
      {WAVES.map(([x, y, s, d], i) => (
        <Layer
          key={i}
          x={x - 1}
          y={y - 4}
          w={17 * s + 2}
          h={6}
          className="map-wave"
          style={{ animationDelay: `${d}s` }}
        >
          <path d="M0 0q2.5 -2.6 5 0t5 0t5 0" transform={`translate(${x} ${y - 0.6}) scale(${s})`} />
        </Layer>
      ))}

      {/* a little boat */}
      <Layer x={40} y={164} w={22} h={20} className="map-boat">
        <g transform="translate(51 179)">
          <path d="M-8 -3H8L5 2H-5Z" className="map-boat-hull" />
          <path d="M0 -3V-14L6.5 -5Z" className="map-boat-sail" />
          <path d="M-1 -4L-6 -4L-1 -12.5" className="map-boat-sail map-boat-sail--small" />
        </g>
      </Layer>

      {/* compass needle */}
      <Layer x={cx - 16} y={cy - 16} w={32} h={32} className="map-needle">
        <path d={`M${cx} ${cy - 14.5}L${cx + 2.6} ${cy}L${cx - 2.6} ${cy}Z`} className="map-needle-n" />
        <path d={`M${cx} ${cy + 14.5}L${cx + 2.6} ${cy}L${cx - 2.6} ${cy}Z`} className="map-needle-s" />
        <circle cx={cx} cy={cy} r="1.6" className="map-needle-pin" />
      </Layer>

      {/* search box contents */}
      <div className="map-query">
        <span className="map-placeholder">search an address…</span>
        <span ref={typedRef} className="map-typed" />
        <span className="map-caret" />
      </div>
      <Layer x={176} y={11} w={18} h={16} className="map-mag">
        <circle cx="183.6" cy="18" r="4.1" />
        <path d="M186.6 21.1L190.6 25" />
      </Layer>

      {/* the geocoding run */}
      <div className="map-acts">
        <Layer {...dotsBox} className="map-dots">
          {MEASURE.dots.map(([x, y], i) => (
            <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="1.35" style={{ '--i': i } as CSSProperties} />
          ))}
        </Layer>

        <Pin at={PIN_B} kind="b" />
        <Pin at={PIN_A} kind="a" />

        <Layer
          x={TAG[0] - 22}
          y={TAG[1] - 10}
          w={44}
          h={20}
          className="map-tag"
          style={{ animationDelay: `${MEASURE.dots.length * 45}ms` }}
        >
          <g transform={`translate(${TAG[0]} ${TAG[1]}) rotate(-4)`}>
            <path d={MAP.tag} className="map-tag-box" />
            <text y="3.6" className="map-tag-text">
              {DISTANCE}
            </text>
          </g>
        </Layer>

        <Layer x={XS[0] - 8} y={XS[1] - 8} w={84} h={30} className="map-x">
          <g transform={`translate(${XS[0]} ${XS[1]})`}>
            <path d={MAP.xA} pathLength={1} className="map-x-stroke" />
            <path d={MAP.xB} pathLength={1} className="map-x-stroke map-x-stroke--2" />
            <text x="9" y="15" className="map-x-note" transform="rotate(-5)">
              x marks the spot!
            </text>
          </g>
        </Layer>
      </div>
    </div>
  );
}
