import type { ThemeMeta } from '../../theme.ts';

/** Graph paper: 10-unit squares on a 320 x 200 sheet, same grid the scene draws. */
const GRID = 'rgba(58, 111, 196, 0.13)';

export default {
  accent: 'var(--crayon-green)',
  background: `linear-gradient(${GRID} 1px, transparent 1px) 0 0 / 100% 5%, linear-gradient(90deg, ${GRID} 1px, transparent 1px) 0 0 / 3.125% 100%, #fbf8ee`,
} satisfies ThemeMeta;
