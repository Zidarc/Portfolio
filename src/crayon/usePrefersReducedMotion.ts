import { useMediaQuery } from '../hooks/useMediaQuery.ts';

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
