import { useId, type CSSProperties } from 'react';
import type { ThemeSceneProps } from '../../theme.ts';
import { Astronaut, AstronautArm, HeroStar, Rocket, Sky, Spiral, TwinkleLayer } from './art.tsx';
import { GCC_EDGES, GCC_NODES, GRAPH_EDGES, GRAPH_NODES, HERO_STARS, PAD, type Edge, type Node } from './geometry.ts';
import './galaxy.css';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const EDGES: Edge[] = [...GRAPH_EDGES, ...GCC_EDGES];
const NODES: (Node & { gcc: boolean })[] = [
  ...GRAPH_NODES.map((n) => ({ ...n, gcc: false })),
  ...GCC_NODES.map((n) => ({ ...n, gcc: true })),
];

const edgeStyle = (e: Edge): Vars => ({
  '--x': e.x.toFixed(2),
  '--y': e.y.toFixed(2),
  '--w': e.len.toFixed(2),
  '--a': `${e.angle.toFixed(1)}deg`,
  '--d': `${e.delay.toFixed(2)}s`,
  '--t': `${e.dur.toFixed(2)}s`,
});

/**
 * GitHub Campus Club: a kid's crayon space picture. Idle, the stars twinkle, the galaxy turns
 * and the astronaut drifts. Active, hidden constellations join up into a git commit graph
 * (main + a feature branch merging back) and the letters GCC, shooting stars with commit-dot
 * tails streak past, the astronaut waves and a rocket blasts off the ringed planet.
 *
 * Everything moves with CSS transform/opacity on small composited layers; there is no JS clock.
 */
export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const uid = `gx${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const live = active && !reducedMotion;
  const cls = ['gx-scene', live && 'gx-live', reducedMotion && 'gx-still', !visible && 'gx-paused']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      <div className="gx-layer gx-nebula" />
      <Sky uid={uid} />
      {[0, 1, 2].map((g) => (
        <TwinkleLayer key={g} group={g} />
      ))}

      <div className="gx-spiral" style={{ '--x': 168, '--y': 151 } as Vars}>
        <div className="gx-spiral__turn">
          <Spiral uid={uid} />
        </div>
      </div>

      {/* constellations: glows under, lines over */}
      {NODES.map((n, i) => (
        <span
          key={i}
          className={`gx-glow${n.big ? ' gx-glow--big' : ''}${n.gcc ? ' gx-glow--gcc' : ''}`}
          style={{ '--x': n.x, '--y': n.y, '--d': `${n.at.toFixed(2)}s` } as Vars}
        />
      ))}
      {EDGES.map((e, i) => (
        <span key={i} className={`gx-edge gx-edge--${e.kind}`} style={edgeStyle(e)} />
      ))}
      <svg className="gx-layer gx-labels" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" focusable="false">
        <text x="196" y="23" className="gx-label gx-label--main">
          main
        </text>
        <text x="184" y="81" className="gx-label gx-label--branch">
          feature
        </text>
        <text x="262" y="52" className="gx-label gx-label--merge">
          merged!
        </text>
      </svg>

      {HERO_STARS.map((s, i) => (
        <span
          key={i}
          className="gx-hero"
          style={{ '--x': s.x, '--y': s.y, '--r': s.r, '--t': `${s.t}s`, '--d': `${s.d}s` } as Vars}
        >
          <span className="gx-hero__twinkle">
            <HeroStar i={i} />
          </span>
        </span>
      ))}

      {/* rocket on the ringed planet */}
      <div className="gx-pad" style={{ '--x': PAD.x, '--y': PAD.y } as Vars}>
        <span className="gx-puff gx-puff--1" />
        <span className="gx-puff gx-puff--2" />
        <span className="gx-puff gx-puff--3" />
        <div className="gx-rocket">
          <span className="gx-flame">
            <span className="gx-flame__flicker" />
          </span>
          <Rocket uid={uid} />
        </div>
      </div>

      <div className="gx-astro">
        <div className="gx-astro__float">
          <div className="gx-astro__arm">
            <AstronautArm uid={uid} />
          </div>
          <Astronaut uid={uid} />
        </div>
      </div>

      <span className="gx-shoot gx-shoot--1" />
      <span className="gx-shoot gx-shoot--2" />
    </div>
  );
}
