import { useEffect, useState } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import './HunaRun.css';

const WORD = 'huna';

/**
 * Easter egg: type "huna" anywhere on the page (not in a text box) and Huna hops across the bottom of
 * the screen once. Until then this is one key listener; the cat is only drawn while she's crossing,
 * and she moves by `transform` alone.
 */
export function HunaRun() {
  const [run, setRun] = useState(0);

  useEffect(() => {
    let typed = '';
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || el?.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-WORD.length);
      if (typed === WORD) {
        typed = '';
        setRun((n) => n + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!run) return null;
  return (
    // a new key for each run, so typing it again sends her across again
    <div key={run} className="huna-run" aria-hidden="true" onAnimationEnd={(e) => e.target === e.currentTarget && setRun(0)}>
      <div className="huna-run__hop">
        <CrayonDoodle name="cat" instant decorative color="var(--crayon-graphite)" />
      </div>
    </div>
  );
}
