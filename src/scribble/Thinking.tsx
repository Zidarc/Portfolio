import { useEffect, useState } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import type { DoodleName } from '../crayon/doodles.ts';

/** What the crayon doodles while the AI reads, one after another. */
const DOODLES: DoodleName[] = ['spiral', 'bulb', 'sparkle'];
/** The pause after each doodle is finished, before the next one starts. */
const REST_MS = 500;

/**
 * Shown on the sketchpad while the AI reads the sheet: a little crayon doodling to itself, so the few
 * seconds of waiting have something to watch. Sits at (left, top) on the sheet, in screen pixels.
 */
export function Thinking({ left, top }: { left: number; top: number }) {
  const [n, setN] = useState(0);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => {
      setWaiting(false);
      setN((x) => x + 1);
    }, REST_MS);
    return () => clearTimeout(t);
  }, [waiting]);

  return (
    <div className="sketchpad__thinking" style={{ left, top }} role="status">
      <span className="sketchpad__thinking-doodle" aria-hidden="true">
        <CrayonDoodle
          key={n}
          name={DOODLES[n % DOODLES.length]!}
          decorative
          tempo={2.2}
          color="var(--crayon-purple)"
          onDone={() => setWaiting(true)}
        />
      </span>
      <span>reading your sheet…</span>
    </div>
  );
}
