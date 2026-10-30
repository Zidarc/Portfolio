import { glyphs } from './font/hersheySans.ts';
import { createNoise1D, createRng, gauss, range } from './random.ts';
import type { Point } from './geometry.ts';
import type { CrayonStyle } from './style.ts';
import { CAP, finishPlan, handDrawn, pointSpacing, type CrayonPlan, type RawStroke } from './strokes.ts';

export interface HandwritingOptions extends CrayonStyle {
  seed: number;
  align?: 'left' | 'center';
  /** All in cap heights. */
  lineHeight?: number;
  letterSpacing?: number;
  wordSpacing?: number;
  /** Roughly how many screen px one unit will be, if known: small text gets fewer points. */
  pxPerUnit?: number;
  /** pxPerUnit is exact (text sized by its cap height), so edge lines too thin to see can be left out. */
  exactSize?: boolean;
}

/** Kids draw the round part of these before the stem, and dot i/j last. */
const KID_ORDER: Record<string, number[]> = { a: [1, 0], d: [1, 0], g: [1, 0], q: [1, 0], i: [1, 0], j: [1, 0] };

const SUBSTITUTES: Record<string, string> = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...' };

export function planHandwriting(text: string, opts: HandwritingOptions): CrayonPlan {
  const m = opts.messiness;
  const lineHeight = (opts.lineHeight ?? 1.75) * CAP;
  const letterSpacing = (opts.letterSpacing ?? 0.22) * CAP;
  const wordSpacing = (opts.wordSpacing ?? 0.6) * CAP;

  const spacing = pointSpacing(opts.pxPerUnit);
  const rng = createRng(opts.seed);
  const baselineDrift = createNoise1D(rng);
  const slantDrift = createNoise1D(rng);

  const normalised = [...text].map((c) => SUBSTITUTES[c] ?? c).join('');
  const lineStrokes: RawStroke[][] = [];
  let pendingPause = 0;

  normalised.split('\n').forEach((line, li) => {
    const strokes: RawStroke[] = [];
    const lineY = li * lineHeight;
    let x = 0;
    pendingPause += li === 0 ? 0 : range(rng, 280, 380);

    for (const ch of line) {
      const glyph = glyphs[ch];
      if (!glyph) {
        // space (or anything we can't draw): move the pen over and think for a moment
        x += wordSpacing * (1 + gauss(rng) * 0.2 * m);
        pendingPause += range(rng, 160, 260);
        continue;
      }

      // thin letters (l, i, !, comma) have no ink width, so give them side bearings or two in a row merge
      const bearing = glyph.w < 0.2 ? 0.08 * CAP : 0;
      x += bearing;

      // per-letter personality: size, squash, tilt, wandering baseline
      const sx = 1 + gauss(rng) * 0.06 * m;
      const sy = sx * (1 + gauss(rng) * 0.05 * m);
      const tilt = ((gauss(rng) * 3 + slantDrift(x / 220 + li * 5) * 3.5) * m * Math.PI) / 180;
      const baseY = lineY + baselineDrift(x / 260 + li * 7) * 0.07 * m * CAP + gauss(rng) * 0.025 * m * CAP;
      const pivot = { x: (glyph.w * sx * CAP) / 2, y: -0.5 * sy * CAP };
      const cos = Math.cos(tilt);
      const sin = Math.sin(tilt);

      const order = KID_ORDER[ch] ?? glyph.s.map((_, i) => i);
      order.forEach((si, k) => {
        const flat = glyph.s[si];
        if (!flat) return;
        const pts: Point[] = [];
        for (let i = 0; i < flat.length; i += 2) {
          const lx = flat[i]! * sx * CAP - pivot.x;
          const ly = flat[i + 1]! * sy * CAP - pivot.y;
          pts.push({ x: x + pivot.x + lx * cos - ly * sin, y: baseY + pivot.y + lx * sin + ly * cos });
        }
        strokes.push({
          pts: handDrawn(pts, m, rng, spacing),
          pause: pendingPause + (k === 0 ? range(rng, 70, 140) : range(rng, 40, 90)) + (rng() < 0.08 * m ? range(rng, 80, 180) : 0),
        });
        pendingPause = 0;
      });

      x += glyph.w * sx * CAP + bearing + letterSpacing * Math.max(0.6, 1 + gauss(rng) * 0.3 * m);
    }
    lineStrokes.push(strokes);
  });

  if (opts.align === 'center') {
    const extents = lineStrokes.map((strokes) => {
      const xs = strokes.flatMap((s) => s.pts.map((p) => p.x));
      return xs.length ? { min: Math.min(...xs), max: Math.max(...xs) } : { min: 0, max: 0 };
    });
    const widest = Math.max(0, ...extents.map((e) => e.max - e.min));
    lineStrokes.forEach((strokes, li) => {
      const e = extents[li]!;
      const shift = (widest - (e.max - e.min)) / 2 - e.min;
      for (const s of strokes) for (const p of s.pts) p.x += shift;
    });
  }

  return finishPlan(lineStrokes.flat(), m, opts.speed, opts.weight, rng, undefined, opts.exactSize ? opts.pxPerUnit : undefined);
}
