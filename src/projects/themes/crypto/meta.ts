import type { ThemeMeta } from '../../theme.ts';

/** Crayon night sky; Scene.css paints the same gradient so there's no flash while the chunk loads. */
export const NIGHT_SKY = 'radial-gradient(75% 95% at 88% 10%, #4d3672 0%, #35264f 45%, #271c3c 100%)';

export default {
  // burnt-orange crayon: reads as "gold coin" but keeps the title/tagline legible on paper
  accent: '#b0520f',
  background: NIGHT_SKY,
} satisfies ThemeMeta;
