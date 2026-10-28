/**
 * A tiny pretend market: a row of candles, one "live" candle that ticks, a smoothed price scale.
 * Pure data + geometry; Scene.tsx owns the DOM and the clock.
 */
import { createRng, type Rng } from '../../../crayon/random.ts';

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  /** Per-candle wobble, so each one keeps its own hand-drawn wiggles as it slides along. */
  jit: number[];
}

export type TickKind = 'idle' | 'active' | 'kick';

/** Chart geometry in scene units (the scene is a 320 x 200 viewBox). */
export const CHART = { left: 26, spacing: 17, body: 10, top: 42, bottom: 178, clipLeft: 17, clipRight: 214 };
/** Candles kept in the array: one hidden off the left edge (it slides out) + 11 visible. */
export const SLOTS = 12;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export class Market {
  readonly rng: Rng;
  candles: Candle[] = [];
  /** Where the live candle is heading; `shown` chases it so jumps grow instead of snapping. */
  target: number;
  shown: number;
  /** Yesterday's close, for the % change. */
  readonly ref: number;
  ticksInCandle = 0;
  /** 1 right after a new candle opens, eases to 0 as the row slides left. */
  shift = 0;
  lo = 0;
  hi = 1;

  constructor(seed = 7) {
    this.rng = createRng(seed);
    let p = 92;
    for (let i = 0; i < SLOTS; i++) {
      const o = p;
      const c = o * (1 + (this.rng() - 0.32) * 0.035);
      const h = Math.max(o, c) * (1 + this.rng() * 0.012);
      const l = Math.min(o, c) * (1 - this.rng() * 0.012);
      this.candles.push({ o, h, l, c, jit: this.jitter() });
      p = c;
    }
    // finish on a calm green candle
    const last = this.live;
    last.c = last.o * 1.012;
    last.h = Math.max(last.h, last.c * 1.004);
    this.target = this.shown = last.c;
    this.ref = last.c / 1.024;
    this.ticksInCandle = 2;
    this.settleScale(1);
  }

  get live(): Candle {
    return this.candles[this.candles.length - 1]!;
  }

  get pct(): number {
    return (this.shown / this.ref - 1) * 100;
  }

  private jitter() {
    return Array.from({ length: 10 }, () => this.rng() * 2 - 1);
  }

  private openCandle() {
    const p = this.target;
    this.candles.push({ o: p, h: p, l: p, c: p, jit: this.jitter() });
    this.candles.shift();
    this.shift = Math.min(this.shift + 1, 1.6);
    this.ticksInCandle = 0;
  }

  /** Move the market once. Returns the % move of this tick. */
  tick(kind: TickKind): number {
    const perCandle = kind === 'idle' ? 4 : 3;
    if (kind === 'kick' || this.ticksInCandle >= perCandle) this.openCandle();

    const r = this.rng();
    let pct: number;
    if (kind === 'kick') {
      // the market "goes live": usually a rocket, sometimes a crash
      pct = r < 0.75 ? 4.5 + this.rng() * 3 : -(3.5 + this.rng() * 2.5);
    } else if (kind === 'active') {
      const stretch = this.target / (this.ref * 1.06) - 1;
      pct = (r - 0.4) * 5.5 - clamp(stretch * 30, -3, 3);
    } else {
      const stretch = this.target / (this.ref * 1.024) - 1;
      pct = (r - 0.5) * 0.9 - clamp(stretch * 12, -0.8, 0.8);
    }
    this.target *= 1 + pct / 100;
    this.ticksInCandle++;
    return pct;
  }

  /** Advance the smooth bits by dt seconds. */
  step(dt: number) {
    const k = 1 - Math.exp(-dt * 7);
    this.shown += (this.target - this.shown) * k;
    const live = this.live;
    live.c = this.shown;
    live.h = Math.max(live.h, this.shown);
    live.l = Math.min(live.l, this.shown);
    this.shift += (0 - this.shift) * (1 - Math.exp(-dt * 5));
    if (this.shift < 0.002) this.shift = 0;
    this.settleScale(1 - Math.exp(-dt * 3));
  }

  /** Ease the price scale towards the visible candles' range. Returns how much it moved. */
  settleScale(k: number) {
    let min = Infinity;
    let max = -Infinity;
    for (const c of this.candles) {
      min = Math.min(min, c.l);
      max = Math.max(max, c.h);
    }
    const span = Math.max(max - min, this.ref * 0.04);
    const mid = (max + min) / 2;
    const lo = mid - span * 0.56;
    const hi = mid + span * 0.56;
    const moved = Math.abs(lo - this.lo) + Math.abs(hi - this.hi);
    this.lo += (lo - this.lo) * k;
    this.hi += (hi - this.hi) * k;
    return moved;
  }

  /** Jump straight to a settled frame (reduced motion / first paint). */
  settle() {
    this.shown = this.target;
    this.step(0);
    this.shift = 0;
    this.settleScale(1);
  }

  y(price: number) {
    return CHART.bottom - ((price - this.lo) / (this.hi - this.lo)) * (CHART.bottom - CHART.top);
  }
}

/* ---------- hand-drawn geometry ---------- */

const f = (n: number) => n.toFixed(1);

/** A slightly crooked box, drawn in one go with the end overshooting the start like a kid's would. */
export function wobblyRect(x1: number, y1: number, x2: number, y2: number, j: number[]) {
  const a = (i: number, amp: number) => (j[i] ?? 0) * amp;
  const ax = x1 + a(0, 0.5);
  const ay = y1 + a(1, 0.4);
  return (
    `M${f(ax)} ${f(ay)}` +
    `L${f(x2 + a(2, 0.5))} ${f(y1 + a(3, 0.4))}` +
    `L${f(x2 + a(4, 0.5))} ${f(y2 + a(5, 0.4))}` +
    `L${f(x1 + a(6, 0.5))} ${f(y2 + a(7, 0.4))}` +
    `L${f(ax - 0.3)} ${f(ay - 0.2)}` +
    `L${f(ax + 1.4 + a(8, 0.4))} ${f(ay - 0.6)}`
  );
}

/** A crayon line through points, with small wobbles every ~10 units. */
export function wobblyLine(points: [number, number][], rng: Rng, amp = 0.6) {
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i]!;
    if (i === 0) {
      d += `M${f(x)} ${f(y)}`;
      continue;
    }
    const [px, py] = points[i - 1]!;
    const len = Math.hypot(x - px, y - py) || 1;
    const nx = -(y - py) / len;
    const ny = (x - px) / len;
    const steps = Math.max(1, Math.round(len / 10));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const w = s === steps ? 0 : (rng() * 2 - 1) * amp;
      d += `L${f(px + (x - px) * t + nx * w)} ${f(py + (y - py) * t + ny * w)}`;
    }
  }
  return d;
}
