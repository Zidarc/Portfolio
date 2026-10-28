/**
 * The kid's pixel picture (a house, a sun, a tree) and the BMP filters from the C project,
 * applied to its colours once up front. Every filtered version is painted onto its own canvas
 * a single time; the scene only wipes between finished canvases.
 */
import { createRng } from '../../../crayon/random.ts';

export const GRID_W = 48;
export const GRID_H = 25;
/** Canvas pixels per picture pixel. */
const CELL = 20;

type RGB = [number, number, number];

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

const C = {
  sky: hex('#a6d4f2'),
  cloud: hex('#fbfaf4'),
  sun: hex('#f6c935'),
  ray: hex('#ea7a2c'),
  grass: hex('#5daa4c'),
  grassLight: hex('#7cc463'),
  grassDark: hex('#3f8f43'),
  wall: hex('#d6453d'),
  roof: hex('#7a4a2e'),
  chimney: hex('#9b3a33'),
  door: hex('#5a3a1c'),
  knob: hex('#f6c935'),
  window: hex('#fde68a'),
  path: hex('#e3c48f'),
  trunk: hex('#8b5a2b'),
  leaf: hex('#3f9a4f'),
  leafDark: hex('#2f7a3c'),
  apple: hex('#d6453d'),
  petal: hex('#f07aa8'),
  centre: hex('#f6c935'),
};

/** The original picture, row by row. */
function basePicture(): RGB[] {
  const rng = createRng(2024);
  const px: RGB[] = Array.from({ length: GRID_W * GRID_H }, () => C.sky);
  const set = (x: number, y: number, c: RGB) => {
    if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) px[y * GRID_W + x] = c;
  };
  const each = (fn: (x: number, y: number) => RGB | null) => {
    for (let y = 0; y < GRID_H; y++)
      for (let x = 0; x < GRID_W; x++) {
        const c = fn(x, y);
        if (c) set(x, y, c);
      }
  };

  // grass with a few lighter and darker tufts
  each((_x, y) => {
    if (y < 19) return null;
    const r = rng();
    if (y === 19 && r < 0.35) return C.grassLight;
    return r < 0.12 ? C.grassDark : C.grass;
  });

  // two fluffy clouds
  const cloud = (cx: number, cy: number, rx: number, ry: number) =>
    each((x, y) => {
      const main = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
      const bump = (x - cx + 1) ** 2 + (y - cy + 1.6) ** 2 <= 2.6;
      return main || bump ? C.cloud : null;
    });
  cloud(8.5, 5, 4.6, 1.7);
  cloud(28, 3.2, 3.6, 1.3);

  // sun with eight rays
  each((x, y) => ((x - 40) ** 2 + (y - 6) ** 2 <= 7.3 ? C.sun : null));
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const reach = k % 2 === 0 ? [4, 5] : [4];
    for (const d of reach) set(Math.round(40 + Math.cos(a) * d), Math.round(6 + Math.sin(a) * d), C.ray);
  }

  // house: chimney, walls, roof, door, windows, path
  each((x, y) => (x >= 15 && x <= 16 && y >= 5 && y <= 9 ? C.chimney : null));
  each((x, y) => (x >= 5 && x <= 18 && y >= 12 && y <= 19 ? C.wall : null));
  each((x, y) => (y >= 6 && y <= 11 && Math.abs(x - 11.5) <= (y - 6) * 1.4 + 0.8 ? C.roof : null));
  each((x, y) => (x >= 10 && x <= 12 && y >= 15 && y <= 19 ? C.door : null));
  set(12, 17, C.knob);
  each((x, y) => ((x >= 6 && x <= 8) || (x >= 14 && x <= 16)) && y >= 13 && y <= 15 ? C.window : null);
  each((x, y) => (y >= 20 && Math.abs(x - 11) <= 1 + (y - 20) * 0.6 ? C.path : null));

  // apple tree
  each((x, y) => (x >= 30 && x <= 31 && y >= 13 && y <= 19 ? C.trunk : null));
  each((x, y) => ((x - 30.5) ** 2 + (y - 9.5) ** 2 <= 21 ? (rng() < 0.2 ? C.leafDark : C.leaf) : null));
  set(28, 8, C.apple);
  set(33, 10, C.apple);
  set(30, 12, C.apple);

  // flowers in the grass
  for (const [fx, fy] of [[3, 21], [23, 22], [37, 21], [44, 20], [41, 23]] as const) {
    set(fx - 1, fy, C.petal);
    set(fx + 1, fy, C.petal);
    set(fx, fy - 1, C.petal);
    set(fx, fy + 1, C.petal);
    set(fx, fy, C.centre);
  }
  return px;
}

/* ---------- the filters (same maths as the C code) ---------- */

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

const grayscale = (p: RGB[]): RGB[] =>
  p.map(([r, g, b]) => {
    const v = clamp(0.299 * r + 0.587 * g + 0.114 * b);
    return [v, v, v];
  });

const sepia = (p: RGB[]): RGB[] =>
  p.map(([r, g, b]) => [
    clamp(0.393 * r + 0.769 * g + 0.189 * b),
    clamp(0.349 * r + 0.686 * g + 0.168 * b),
    clamp(0.272 * r + 0.534 * g + 0.131 * b),
  ]);

const invert = (p: RGB[]): RGB[] => p.map(([r, g, b]) => [255 - r, 255 - g, 255 - b]);

export const PIXELATE_BLOCK = 4;

const pixelate = (p: RGB[]): RGB[] => {
  const out = p.slice();
  const k = PIXELATE_BLOCK;
  for (let by = 0; by < GRID_H; by += k)
    for (let bx = 0; bx < GRID_W; bx += k) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let y = by; y < Math.min(by + k, GRID_H); y++)
        for (let x = bx; x < Math.min(bx + k, GRID_W); x++) {
          const c = p[y * GRID_W + x]!;
          r += c[0];
          g += c[1];
          b += c[2];
          n++;
        }
      const avg: RGB = [clamp(r / n), clamp(g / n), clamp(b / n)];
      for (let y = by; y < Math.min(by + k, GRID_H); y++)
        for (let x = bx; x < Math.min(bx + k, GRID_W); x++) out[y * GRID_W + x] = avg;
    }
  return out;
};

/** Layer order matters: index 0 is the untouched picture. */
export const LAYERS = [
  { id: 'original', label: 'Original' },
  { id: 'grayscale', label: 'Grayscale' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'invert', label: 'Invert' },
  { id: 'pixelate', label: 'Pixelate' },
] as const;

export function layerPixels(): RGB[][] {
  const base = basePicture();
  return [base, grayscale(base), sepia(base), invert(base), pixelate(base)];
}

/* ---------- painting one layer onto a canvas, crayon style ---------- */

const css = ([r, g, b]: RGB, k = 1) => `rgb(${clamp(r * k)} ${clamp(g * k)} ${clamp(b * k)})`;

/**
 * Chunky squares coloured in with a crayon: each square is a touch uneven, has a slightly darker
 * rim where the wax piled up, and a few pale streaks where the paper shows through.
 * `block` > 1 merges squares (the pixelate layer).
 */
export function paintLayer(canvas: HTMLCanvasElement, pixels: RGB[], block = 1) {
  canvas.width = GRID_W * CELL;
  canvas.height = GRID_H * CELL;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#fdfcf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const rng = createRng(77);
  const size = CELL * block;
  for (let by = 0; by < GRID_H; by += block)
    for (let bx = 0; bx < GRID_W; bx += block) {
      const c = pixels[by * GRID_W + bx]!;
      const w = Math.min(block, GRID_W - bx) * CELL;
      const h = Math.min(block, GRID_H - by) * CELL;
      const x = bx * CELL;
      const y = by * CELL;
      const tone = 1 + (rng() - 0.5) * 0.07;
      const j = () => (rng() - 0.5) * 1.6;
      const gap = 1.3;

      ctx.beginPath();
      ctx.moveTo(x + gap + j(), y + gap + j());
      ctx.lineTo(x + w - gap + j(), y + gap + j());
      ctx.lineTo(x + w - gap + j(), y + h - gap + j());
      ctx.lineTo(x + gap + j(), y + h - gap + j());
      ctx.closePath();
      ctx.fillStyle = css(c, tone);
      ctx.fill();
      ctx.strokeStyle = css(c, tone * 0.84);
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // pale streaks where the wax skipped
      const streaks = Math.round((w * h) / (size * size) * 4 * block) + 3;
      ctx.lineWidth = 1.1;
      for (let s = 0; s < streaks; s++) {
        const sx = x + 3 + rng() * (w - 8);
        const sy = y + 4 + rng() * (h - 8);
        const len = 3 + rng() * 5;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.12 + rng() * 0.16).toFixed(2)})`;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + len, sy - len * 0.55);
        ctx.stroke();
      }
    }
}
