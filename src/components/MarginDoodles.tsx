import { useRef, type CSSProperties } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import type { DoodleName } from '../crayon/doodles.ts';
import { useInView } from '../hooks/useInView.ts';
import './MarginDoodles.css';

interface Doodle {
  name: DoodleName;
  /** Crayon colour name; doodles with colours of their own (rainbow, rocket flame) keep them. */
  colour: string;
  side: 'left' | 'right';
  /** Down the section, in % of its height. */
  top: number;
  /** Width in px on a wide screen. */
  size: number;
  /** Tilt in degrees, like it was drawn in a hurry. */
  tilt: number;
}

/**
 * The doodles beside each section. The first of each set is the one phones show, small, in the space
 * above the heading; the rest only appear where the page has real margins to draw in.
 */
const SETS = {
  about: [
    { name: 'sun', colour: 'orange', side: 'right', top: 4, size: 96, tilt: 8 },
    { name: 'cloud', colour: 'blue', side: 'left', top: 30, size: 100, tilt: -4 },
    { name: 'heart', colour: 'red', side: 'right', top: 70, size: 60, tilt: -10 },
  ],
  roles: [
    { name: 'crown', colour: 'yellow', side: 'right', top: 3, size: 92, tilt: 10 },
    { name: 'bolt', colour: 'orange', side: 'left', top: 55, size: 56, tilt: -8 },
  ],
  skills: [
    { name: 'bulb', colour: 'yellow', side: 'right', top: 4, size: 70, tilt: 6 },
    { name: 'spiral', colour: 'purple', side: 'left', top: 40, size: 70, tilt: 0 },
    { name: 'bolt', colour: 'blue', side: 'right', top: 75, size: 52, tilt: 12 },
  ],
  projects: [
    { name: 'rocket', colour: 'red', side: 'right', top: 1.2, size: 70, tilt: 18 },
    { name: 'plane', colour: 'blue', side: 'left', top: 22, size: 104, tilt: -6 },
    { name: 'sparkle', colour: 'yellow', side: 'right', top: 45, size: 74, tilt: 0 },
    { name: 'spiral', colour: 'green', side: 'left', top: 70, size: 64, tilt: 0 },
  ],
  draw: [
    { name: 'rainbow', colour: 'red', side: 'right', top: 2, size: 112, tilt: -4 },
    { name: 'heart', colour: 'purple', side: 'left', top: 55, size: 58, tilt: 12 },
  ],
  contact: [
    { name: 'plane', colour: 'purple', side: 'right', top: 4, size: 104, tilt: -8 },
    { name: 'note', colour: 'blue', side: 'left', top: 48, size: 64, tilt: 6 },
  ],
  footer: [
    { name: 'fish', colour: 'orange', side: 'left', top: 10, size: 92, tilt: -4 },
    { name: 'moon', colour: 'yellow', side: 'right', top: 0, size: 64, tilt: 10 },
  ],
} satisfies Record<string, Doodle[]>;

function MarginDoodle({ d, index }: { d: Doodle; index: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  // planned only once it's close, drawn once it's in view, then it's just a still picture
  const near = useInView(ref, { rootMargin: '300px 0px', background: true });
  const seen = useInView(ref);
  const style = { '--top': `${d.top}%`, '--size': `${d.size}px`, '--tilt': `${d.tilt}deg` } as CSSProperties;

  return (
    <span
      ref={ref}
      className={`margin-doodle margin-doodle--${d.side}${index === 0 ? ' margin-doodle--lead' : ''}`}
      style={style}
    >
      {near && (
        <CrayonDoodle
          name={d.name}
          decorative
          play={seen}
          delay={150 + index * 450}
          tempo={1.8}
          color={`var(--crayon-${d.colour})`}
        />
      )}
    </span>
  );
}

/** Drop inside a section (or the footer) to give it its doodles. */
export function MarginDoodles({ set }: { set: keyof typeof SETS }) {
  return (
    <div className="margin-doodles" aria-hidden="true">
      {SETS[set].map((d, i) => (
        <MarginDoodle key={`${d.name}${i}`} d={d} index={i} />
      ))}
    </div>
  );
}
