/** Seeded randomness so a given seed always produces the same handwriting. */
export type Rng = () => number;

/** mulberry32: tiny, fast, good-enough PRNG. Returns floats in [0, 1). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Uniform in [min, max). */
export const range = (rng: Rng, min: number, max: number) => min + rng() * (max - min);

/** Roughly normal (mean 0, sd 1), clamped to ±2.5 so outliers never get silly. */
export function gauss(rng: Rng): number {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(-2.5, Math.min(2.5, n));
}

/**
 * Smooth 1D value noise in [-1, 1]. Lattice points are spaced 1 apart,
 * so `noise(t / wavelength)` gives a wobble with that wavelength.
 * Lattice values are hashed from one seed when needed (a stroke only touches a few of the 64), instead of
 * drawing all 64 up front: thousands of strokes each make four of these.
 */
export function createNoise1D(rng: Rng): (t: number) => number {
  const seed = Math.floor(rng() * 4294967296) >>> 0;
  const lattice = (i: number) => {
    let t = (seed + Math.imul(i & 63, 0x9e3779b9)) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
  return (t) => {
    const i = Math.floor(t);
    const f = t - i;
    const a = lattice(i);
    const b = lattice(i + 1);
    const s = f * f * (3 - 2 * f);
    return a + (b - a) * s;
  };
}
