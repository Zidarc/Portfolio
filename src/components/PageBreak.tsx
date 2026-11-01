import { createRng, gauss, range } from '../crayon/random.ts';
import './PageBreak.css';

const WIDTH = 1200;
const STEP = 10;

interface Tear {
  /** The pale torn fibres between the two pieces. */
  fibres: string;
  /** The thin shadow the upper piece casts on the lower one. */
  shadow: string;
  tapes: { left: number; tilt: number }[];
}

/** One torn edge: a jagged band across the page, the same every visit for a given seed. */
function tear(seed: number): Tear {
  const rng = createRng(seed);
  const top: number[] = [];
  const bottom: number[] = [];
  let drift = 0;
  for (let x = 0; x <= WIDTH; x += STEP) {
    drift = Math.max(-6, Math.min(6, drift + gauss(rng) * 1.4)); // the tear wanders up and down
    const y = 14 + drift + range(rng, -1.6, 1.6); // with little fibre spikes along it
    top.push(y);
    bottom.push(y + range(rng, 2.5, 6));
  }
  const xs = top.map((_, i) => i * STEP);
  const line = (ys: number[], dy = 0) => ys.map((y, i) => `${xs[i]} ${(y + dy).toFixed(1)}`);
  const back = (ys: number[], dy = 0) => line(ys, dy).reverse();
  // one strip somewhere in the middle, or two towards the sides
  const spots = rng() < 0.5 ? [[18, 72]] : [[8, 35], [60, 85]];
  const tapes = spots.map(([from, to]) => ({ left: range(rng, from!, to!), tilt: range(rng, -9, 9) }));
  return {
    fibres: `M${line(top).join('L')}L${back(bottom).join('L')}Z`,
    shadow: `M${line(bottom).join('L')}L${back(bottom, 2.5).join('L')}Z`,
    tapes,
  };
}

const TEARS = [11, 23, 37, 41, 53, 67].map(tear);

/**
 * Between sections, the page looks torn and taped back together. Purely decoration: a static
 * SVG and a couple of tape strips, nothing that moves or redraws while scrolling.
 */
export function PageBreak({ index }: { index: number }) {
  const { fibres, shadow, tapes } = TEARS[index % TEARS.length]!;
  return (
    <div className="page-break" aria-hidden="true">
      <svg className="page-break__tear" viewBox={`0 0 ${WIDTH} 30`} preserveAspectRatio="none">
        <path className="page-break__shadow" d={shadow} />
        <path className="page-break__fibres" d={fibres} />
      </svg>
      {tapes.map(({ left, tilt }, i) => (
        <span key={i} className="page-break__tape" style={{ left: `${left}%`, rotate: `${tilt}deg` }} />
      ))}
    </div>
  );
}
