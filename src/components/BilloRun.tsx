import { useEffect, useState, type CSSProperties } from 'react';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { createRng, range, randomSeed } from '../crayon/random.ts';
import './BilloRun.css';

const WORD = 'billo';
/** Time between paw prints, and how long the finished trail stays before fading. */
const STEP_MS = 170;
const LINGER_MS = 2200;

interface Paw {
  x: number;
  y: number;
  turn: number;
}

/**
 * A walk across the bottom of the screen, left to right: steps alternate either side of a gently
 * wandering line, like a cat trotting, and each print points the way it's going.
 */
function trail(width: number, height: number): Paw[] {
  const rng = createRng(randomSeed());
  const count = Math.max(8, Math.round(width / 70));
  const base = height - range(rng, 70, 110);
  const sway = range(rng, 10, 26);
  const line = (i: number) => {
    const t = i / (count - 1);
    return { x: -10 + t * (width + 20), y: base + Math.sin(t * Math.PI * 1.6) * sway };
  };
  return Array.from({ length: count }, (_, i) => {
    const here = line(i);
    const next = line(i + 1);
    const heading = (Math.atan2(next.y - here.y, next.x - here.x) * 180) / Math.PI;
    // left and right feet either side of the line; prints point along it (they're drawn pointing up)
    return { x: here.x, y: here.y + (i % 2 ? 9 : -9), turn: heading + 90 + range(rng, -8, 8) };
  });
}

/** One crayon paw print (a pad and four toes), pointing up. */
const PawPrint = () => (
  <svg viewBox="-12 -14 24 26" className="billo-paw__svg">
    <ellipse cx="0" cy="4" rx="6.6" ry="5.6" />
    <ellipse cx="-7" cy="-4" rx="2.6" ry="3.3" transform="rotate(-20 -7 -4)" />
    <ellipse cx="-2.6" cy="-9" rx="2.6" ry="3.4" />
    <ellipse cx="2.6" cy="-9" rx="2.6" ry="3.4" />
    <ellipse cx="7" cy="-4" rx="2.6" ry="3.3" transform="rotate(20 7 -4)" />
  </svg>
);

/**
 * Easter egg: type "billo" anywhere on the page (not in a text box) and Billo walks across the bottom
 * of the screen, leaving crayon paw prints one step at a time, and signs it. Until then this is one key
 * listener; while it plays, the prints only fade in and out (opacity), and it's all removed afterwards.
 */
export function BilloRun() {
  const [walk, setWalk] = useState<{ id: number; paws: Paw[] } | null>(null);

  useEffect(() => {
    let typed = '';
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || el?.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-WORD.length);
      if (typed === WORD) {
        typed = '';
        setWalk((w) => ({ id: (w?.id ?? 0) + 1, paws: trail(innerWidth, innerHeight) }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!walk) return null;
  const { paws } = walk;
  const total = paws.length * STEP_MS + LINGER_MS;
  // the signature goes above the middle of the trail
  const mid = paws[Math.floor(paws.length / 2)]!;

  return (
    <div
      key={walk.id}
      className="billo-walk"
      aria-hidden="true"
      style={{ '--total': `${total}ms` } as CSSProperties}
      onAnimationEnd={(e) => e.target === e.currentTarget && setWalk(null)}
    >
      {paws.map((p, i) => (
        <span
          key={i}
          className="billo-paw"
          style={{ left: p.x, top: p.y, rotate: `${p.turn}deg`, '--d': `${i * STEP_MS}ms` } as CSSProperties}
        >
          <PawPrint />
        </span>
      ))}
      <span className="billo-walk__sign" style={{ left: mid.x, top: mid.y - 70 }}>
        <CrayonText text="Billo was here" decorative capHeight={20} tempo={1.3} color="var(--crayon-graphite)" />
      </span>
    </div>
  );
}
