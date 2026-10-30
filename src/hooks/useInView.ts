import { startTransition, useEffect, useState, type RefObject } from 'react';

/**
 * True once the element has scrolled into view (stays true unless `once` is false).
 * `background`: the change only starts preparation work (planning a drawing, building a scene), so React
 * may do it in small slices instead of one long freeze when several things come near at once.
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  {
    once = true,
    rootMargin = '0px 0px -15% 0px',
    background = false,
  }: { once?: boolean; rootMargin?: string; background?: boolean } = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (background) startTransition(() => setInView(true));
          else setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, once, rootMargin, background]);

  return inView;
}
