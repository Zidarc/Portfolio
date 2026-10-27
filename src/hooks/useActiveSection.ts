import { useEffect, useState } from 'react';

/**
 * Which of the given section ids is currently under the middle of the viewport.
 * Returns the first id until the observer reports in.
 */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');
  const key = ids.join(',');

  useEffect(() => {
    const sections = key
      .split(',')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    // a thin band across the middle of the screen: whichever section crosses it is "here"
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [key]);

  return active;
}
