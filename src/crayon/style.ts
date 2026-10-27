import { createRng, range } from './random.ts';

/** How the hand holding the crayon behaves. */
export interface CrayonStyle {
  /** 0 = neat, 1 = average kid, 2 = rushed kid. */
  messiness: number;
  /** 1 = natural pace; 2 = twice as fast. */
  speed: number;
  /** Crayon line width, in cap heights (text) or hundredths of the drawing (doodles). */
  weight: number;
}

/** Every unset style value is picked from these ranges, so each visit looks a little different. */
export const STYLE_RANGES: Record<keyof CrayonStyle, [number, number]> = {
  messiness: [0.75, 1.25],
  speed: [1.1, 1.65],
  weight: [0.08, 0.12],
};

/** Deterministic per seed, so `?seed=` links reproduce the exact same hand. */
export function rollStyle(seed: number): CrayonStyle {
  const rng = createRng(seed ^ 0x9e3779b9);
  return {
    messiness: range(rng, ...STYLE_RANGES.messiness),
    speed: range(rng, ...STYLE_RANGES.speed),
    weight: range(rng, ...STYLE_RANGES.weight),
  };
}

/** Rolled style, with any explicitly given values taking priority. */
export function resolveStyle(seed: number, given: Partial<CrayonStyle>): CrayonStyle {
  const rolled = rollStyle(seed);
  return {
    messiness: given.messiness ?? rolled.messiness,
    speed: given.speed ?? rolled.speed,
    weight: given.weight ?? rolled.weight,
  };
}
