/**
 * The still crayon drawings. Each one is painted once; Scene.tsx moves them around with
 * transform/opacity only, so none of these SVGs repaint while the scene animates.
 */
import { CrayonFilter } from '../../../crayon/CrayonFilter.tsx';
import { createRng } from '../../../crayon/random.ts';
import {
  BG_STARS,
  GCC_NODES,
  GRAPH_NODES,
  HERO_STARS,
  MOON,
  PLANET,
  blob,
  ellipse,
  scribble,
  star,
  wobble,
  type Pt,
} from './geometry.ts';

/* ---------- precomputed paths (module scope: built once, shared by every render) ---------- */

const SKY = (() => {
  const rng = createRng(11);
  const { cx, cy, r } = PLANET;
  const ringRot = -14;
  return {
    // two passes of colouring-in, one slanting each way, so the sky reads as waxy crayon
    pass1: scribble(-30, -12, 330, 212, 5.2, 34, rng),
    pass2: scribble(-40, -12, 330, 212, 7.5, -26, rng),
    nebula: scribble(150, 70, 320, 205, 4.5, 30, rng),
    nebula2: scribble(-20, -10, 140, 110, 5, -22, rng),
    nebulaClip: ellipse(238, 150, 92, 48, -18, rng, 0.12),
    nebula2Clip: ellipse(40, 34, 78, 42, 14, rng, 0.12),

    planet: blob(cx, cy, r, rng, 0.035, 14),
    planetBands: [0, 1, 2, 3, 4].map((i) => {
      const y = cy - r + 9 + i * 12;
      return wobble(
        [
          [cx - r - 4, y + 4],
          [cx - r / 2, y + 1],
          [cx, y - 1],
          [cx + r / 2, y + 1],
          [cx + r + 4, y - 3],
        ],
        rng,
        1.2,
      );
    }),
    planetFill: scribble(cx - r - 6, cy - r - 4, cx + r + 6, cy + r + 4, 3, 10, rng),
    craters:
      blob(cx - 14, cy - 15, 4.2, rng, 0.12, 8) + blob(cx + 13, cy - 5, 3, rng, 0.12, 8) + blob(cx - 4, cy + 8, 2.4, rng, 0.12, 8),
    ringRot,
    ring: ellipse(cx, cy - 2, r * 1.75, r * 0.36, ringRot, rng, 0.02),
    ring2: ellipse(cx, cy - 2, r * 1.55, r * 0.27, ringRot, rng, 0.03),

    moon: blob(MOON.cx, MOON.cy, MOON.r, rng, 0.05, 10),
    moonFill: scribble(MOON.cx - 16, MOON.cy - 16, MOON.cx + 16, MOON.cy + 16, 2.6, -7, rng),
    moonCraters:
      blob(MOON.cx - 4, MOON.cy - 3, 2.6, rng, 0.15, 7) + blob(MOON.cx + 4.5, MOON.cy + 3.5, 1.8, rng, 0.15, 7),
    moonlet: blob(MOON.cx - 22, MOON.cy - 15, 3.2, rng, 0.08, 8),

    graphStars: GRAPH_NODES.map((n) =>
      n.big ? star(n.x, n.y, 6, rng, 5, 0.45) : star(n.x, n.y, 3.6, rng, 4, 0.36, -90 + rng() * 20),
    ),
    gccStars: GCC_NODES.map((n) => star(n.x, n.y, 2.6, rng, 4, 0.36, -90 + rng() * 25)).join(''),
  };
})();

// shapes that share a style are joined into one path each (none of them overlap, so they look the same):
// separate elements were most of what the scene cost to lay out
const TWINKLE = BG_STARS.map((group, g) => {
  const rng = createRng(70 + g);
  return group
    .map((s) =>
      s.kind === 'plus'
        ? star(s.x, s.y, s.r * 1.6, rng, 4, 0.3, -90 + rng() * 30)
        : blob(s.x, s.y, s.r, rng, 0.15, 6),
    )
    .join('');
});

const HERO = HERO_STARS.map((_, i) => star(10, 10, 8.4, createRng(90 + i), 5, 0.47));

/* ---------- the sky: colouring, planets, constellation stars ---------- */

export function Sky({ uid }: { uid: string }) {
  const { cx, cy } = PLANET;
  const ringClipRot = `rotate(${SKY.ringRot} ${cx} ${cy - 2})`;
  return (
    <svg className="gx-layer gx-sky" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <CrayonFilter id={`${uid}-wax`} seed={5} pxPerUnit={1.6} strokePx={7} />
        <CrayonFilter id={`${uid}-wax-thin`} seed={9} pxPerUnit={1.6} strokePx={3} />
        <clipPath id={`${uid}-neb`}>
          <path d={SKY.nebulaClip} />
        </clipPath>
        <clipPath id={`${uid}-neb2`}>
          <path d={SKY.nebula2Clip} />
        </clipPath>
        <clipPath id={`${uid}-planet`}>
          <path d={SKY.planet} />
        </clipPath>
        <clipPath id={`${uid}-moon`}>
          <path d={SKY.moon} />
        </clipPath>
        {/* lower half of the ring, which passes in front of the planet */}
        <clipPath id={`${uid}-front`}>
          <rect x={cx - 80} y={cy - 2} width="160" height="60" transform={ringClipRot} />
        </clipPath>
      </defs>

      {/* colouring-in */}
      <g filter={`url(#${uid}-wax)`}>
        <path d={SKY.pass1} className="gx-sky-pass1" />
        <path d={SKY.pass2} className="gx-sky-pass2" />
        <path d={SKY.nebula} className="gx-sky-nebula" clipPath={`url(#${uid}-neb)`} />
        <path d={SKY.nebula2} className="gx-sky-nebula2" clipPath={`url(#${uid}-neb2)`} />
      </g>

      {/* the moon, top right */}
      <g filter={`url(#${uid}-wax-thin)`}>
        <path d={SKY.moon} className="gx-moon-base" />
        <path d={SKY.moonFill} className="gx-moon-fill" clipPath={`url(#${uid}-moon)`} />
        <path d={SKY.moonCraters} className="gx-crater" />
        <path d={SKY.moon} className="gx-outline" />
        <path d={SKY.moonlet} className="gx-moonlet" />
      </g>

      {/* the ringed planet, bottom left */}
      <g filter={`url(#${uid}-wax-thin)`}>
        <path d={SKY.ring} className="gx-ring" />
        <path d={SKY.ring2} className="gx-ring2" />
        <path d={SKY.planet} className="gx-planet-base" />
        <g clipPath={`url(#${uid}-planet)`}>
          <path d={SKY.planetFill} className="gx-planet-fill" />
          {[0, 1, 2].map((k) => (
            <path key={k} d={SKY.planetBands.filter((_, i) => i % 3 === k).join('')} className={`gx-band gx-band--${k}`} />
          ))}
        </g>
        <path d={SKY.craters} className="gx-crater gx-crater--planet" />
        <path d={SKY.planet} className="gx-outline" />
        <g clipPath={`url(#${uid}-front)`}>
          <path d={SKY.ring} className="gx-ring" />
          <path d={SKY.ring2} className="gx-ring2" />
        </g>
      </g>

      {/* constellation stars (their lines are drawn by Scene) */}
      <g filter={`url(#${uid}-wax-thin)`}>
        <path d={SKY.graphStars.filter((_, i) => !GRAPH_NODES[i]?.big).join('')} className="gx-node" />
        <path d={SKY.graphStars.filter((_, i) => GRAPH_NODES[i]?.big).join('')} className="gx-node gx-node--merge" />
        <path d={SKY.gccStars} className="gx-node gx-node--gcc" />
      </g>
    </svg>
  );
}

/** One of the three background-star layers; each pulses its opacity out of step with the others. */
export function TwinkleLayer({ group }: { group: number }) {
  return (
    <svg
      className={`gx-layer gx-twinkle gx-twinkle--${group}`}
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
    >
      <path d={TWINKLE[group]} className="gx-bgstar" />
    </svg>
  );
}

export function HeroStar({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 20 20" focusable="false">
      <path d={HERO[i]} className="gx-hero-shape" />
    </svg>
  );
}

/* ---------- spiral galaxy ---------- */

const SPIRAL = (() => {
  const rng = createRng(31);
  const arm = (phase: number) => {
    const pts: Pt[] = [];
    for (let t = 0.35; t <= 3.6; t += 0.28) {
      const a = t * 1.9 + phase;
      const rr = 2 + t * 4.6;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return wobble(pts, rng, 0.35);
  };
  const dots = Array.from({ length: 14 }, (_, i) => {
    const t = 0.6 + rng() * 2.9;
    const a = t * 1.9 + (i % 2 ? Math.PI : 0) + (rng() - 0.5) * 0.7;
    const rr = 2 + t * 4.6 + (rng() - 0.5) * 3;
    return blob(Math.cos(a) * rr, Math.sin(a) * rr, 0.5 + rng() * 0.5, rng, 0.2, 6);
  });
  return {
    arms: arm(0) + arm(Math.PI),
    inner: arm(0.5) + arm(Math.PI + 0.5),
    core: blob(0, 0, 3.3, rng, 0.1, 8),
    dots: dots.join(''),
  };
})();

export function Spiral({ uid }: { uid: string }) {
  return (
    <svg viewBox="-22 -22 44 44" focusable="false">
      <defs>
        <CrayonFilter id={`${uid}-wax-gal`} seed={21} pxPerUnit={1.6} strokePx={4} />
      </defs>
      <g filter={`url(#${uid}-wax-gal)`}>
        <path d={SPIRAL.arms} className="gx-arm" />
        <path d={SPIRAL.inner} className="gx-arm gx-arm--inner" />
        <path d={SPIRAL.dots} className="gx-arm-dot" />
        <path d={SPIRAL.core} className="gx-core" />
      </g>
    </svg>
  );
}

/* ---------- astronaut (our own: round helmet, crayon suit, commit-graph patch) ---------- */

const SUIT = (() => {
  const rng = createRng(47);
  return {
    pack: wobble(
      [
        [15, 25],
        [44, 23],
        [46, 50],
        [17, 52],
      ],
      rng,
      0.5,
      true,
    ),
    body: blob(31, 41, 13.5, rng, 0.04, 10),
    legL: wobble(
      [
        [25, 50],
        [21, 58],
        [17, 64],
      ],
      rng,
      0.4,
    ),
    legR: wobble(
      [
        [36, 51],
        [41, 58],
        [44, 65],
      ],
      rng,
      0.4,
    ),
    armL: wobble(
      [
        [20, 36],
        [13, 41],
        [9, 47],
      ],
      rng,
      0.4,
    ),
    helmet: blob(32, 19, 14.5, rng, 0.03, 10),
    visor: ellipse(34.5, 19.5, 9.6, 7.4, -8, rng, 0.03),
    shine: wobble(
      [
        [29, 15],
        [32, 13.2],
        [36, 13],
      ],
      rng,
      0.2,
    ),
    antenna: wobble(
      [
        [22, 9],
        [19.5, 3],
      ],
      rng,
      0.2,
    ),
    patch: wobble(
      [
        [26, 41],
        [30, 41],
        [36, 41],
      ],
      rng,
      0.15,
    ),
    patchBranch: wobble(
      [
        [30, 41],
        [33, 45],
        [36, 41],
      ],
      rng,
      0.15,
    ),
    flagPole: wobble(
      [
        [9, 47],
        [6, 26],
      ],
      rng,
      0.25,
    ),
    flag: wobble(
      [
        [6.2, 26.5],
        [-6, 29],
        [-3, 32.5],
        [-8, 37],
        [6.8, 34.5],
      ],
      rng,
      0.35,
    ),
  };
})();

const ARM = (() => {
  const rng = createRng(53);
  return {
    arm: wobble(
      [
        [42, 35],
        [50, 30],
        [55, 22],
      ],
      rng,
      0.4,
    ),
    glove: blob(55.5, 20.5, 3.6, rng, 0.08, 8),
  };
})();

/** A limb as a thick white crayon stroke with a darker edge. */
const Limb = ({ d }: { d: string }) => (
  <>
    <path d={d} className="gx-limb-edge" />
    <path d={d} className="gx-limb" />
  </>
);

export function Astronaut({ uid }: { uid: string }) {
  return (
    <svg viewBox="-10 0 74 72" focusable="false">
      <defs>
        <CrayonFilter id={`${uid}-wax-astro`} seed={14} pxPerUnit={1.2} strokePx={4} />
        <linearGradient id={`${uid}-visor`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6aa0ff" />
          <stop offset="0.55" stopColor="#3a4fc4" />
          <stop offset="1" stopColor="#5b2f96" />
        </linearGradient>
      </defs>
      <g filter={`url(#${uid}-wax-astro)`}>
        <path d={SUIT.flagPole} className="gx-pole" />
        <path d={SUIT.flag} className="gx-flag" />
        <path d={SUIT.pack} className="gx-pack" />
        <Limb d={SUIT.legL} />
        <Limb d={SUIT.legR} />
        <circle cx="17" cy="64.5" r="3.6" className="gx-boot" />
        <circle cx="44.5" cy="65.5" r="3.6" className="gx-boot" />
        <Limb d={SUIT.armL} />
        <circle cx="9" cy="47" r="3.3" className="gx-glove" />
        <path d={SUIT.body} className="gx-suit" />
        <rect x="24" y="36.5" width="14.5" height="9.5" rx="2" className="gx-panel" />
        <path d={SUIT.patch} className="gx-patch" />
        <path d={SUIT.patchBranch} className="gx-patch gx-patch--branch" />
        <circle cx="26" cy="41" r="1.2" className="gx-patch-dot" />
        <circle cx="36" cy="41" r="1.2" className="gx-patch-dot" />
        <circle cx="33" cy="45" r="1.1" className="gx-patch-dot gx-patch-dot--branch" />
        <path d={SUIT.antenna} className="gx-antenna" />
        <circle cx="19.3" cy="2.6" r="2" className="gx-antenna-tip" />
        <path d={SUIT.helmet} className="gx-helmet" />
        <path d={SUIT.visor} fill={`url(#${uid}-visor)`} className="gx-visor" />
        <path d={SUIT.shine} className="gx-shine" />
        <circle cx="40" cy="23" r="1.1" className="gx-shine-dot" />
      </g>
    </svg>
  );
}

/** The waving arm, on its own layer so it can rotate without repainting the astronaut. */
export function AstronautArm({ uid }: { uid: string }) {
  return (
    <svg viewBox="-10 0 74 72" focusable="false">
      <defs>
        <CrayonFilter id={`${uid}-wax-arm`} seed={15} pxPerUnit={1.2} strokePx={4} />
      </defs>
      <g filter={`url(#${uid}-wax-arm)`}>
        <Limb d={ARM.arm} />
        <path d={ARM.glove} className="gx-glove" />
      </g>
    </svg>
  );
}

/* ---------- rocket ---------- */

const ROCKET = (() => {
  const rng = createRng(61);
  return {
    body: wobble(
      [
        [12, 2],
        [17.5, 10],
        [18.5, 22],
        [17, 34],
        [7, 34],
        [5.5, 22],
        [6.5, 10],
      ],
      rng,
      0.25,
      true,
    ),
    nose: wobble(
      [
        [12, 2],
        [16, 8],
        [8, 8],
      ],
      rng,
      0.2,
      true,
    ),
    finL: wobble(
      [
        [6.2, 24],
        [1, 33],
        [1.5, 38],
        [7, 33.5],
      ],
      rng,
      0.25,
      true,
    ),
    finR: wobble(
      [
        [17.8, 24],
        [23, 33],
        [22.5, 38],
        [17, 33.5],
      ],
      rng,
      0.25,
      true,
    ),
    window: blob(12, 18, 3.3, rng, 0.06, 8),
  };
})();

export function Rocket({ uid }: { uid: string }) {
  return (
    <svg viewBox="0 0 24 40" focusable="false">
      <defs>
        <CrayonFilter id={`${uid}-wax-rkt`} seed={33} pxPerUnit={1.4} strokePx={3} />
      </defs>
      <g filter={`url(#${uid}-wax-rkt)`}>
        <rect x="8.5" y="33" width="7" height="4" rx="1" className="gx-nozzle" />
        <path d={ROCKET.finL} className="gx-fin" />
        <path d={ROCKET.finR} className="gx-fin" />
        <path d={ROCKET.body} className="gx-hull" />
        <path d={ROCKET.nose} className="gx-fin" />
        <path d={ROCKET.window} className="gx-window" />
        <path d="M10.6 16.8q1-1 2.2-.9" className="gx-window-shine" />
      </g>
    </svg>
  );
}
