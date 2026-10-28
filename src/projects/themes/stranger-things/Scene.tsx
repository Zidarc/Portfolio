import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { ThemeSceneProps } from '../../theme.ts';
import { BULBS, Room, RoomDefs, TitleHalo, TitleTubes, VINE_GROUPS, Vines, type RoomIds } from './Room.tsx';
import './stranger-things.css';

/** What the lights spell before the room flips. */
const MESSAGE = 'RUN';
const LEAD_IN = 700; // lights die down
const ON = 760; // each letter lit (well under 3 flashes a second)
const OFF = 340;
const FLIP = 900;
/** Bulbs twinkle in this many out-of-step sets (see .st-lights__set). */
const TWINKLE_SETS = [0, 1, 2];

type Phase = 'idle' | 'spell' | 'flip' | 'upside';

const rand = (i: number, salt: number) => {
  const v = Math.sin(i * 91.17 + salt * 17.31) * 24634.6345;
  return v - Math.floor(v);
};

const SPORES = Array.from({ length: 18 }, (_, i) => ({
  '--x': `${(rand(i, 1) * 100).toFixed(1)}%`,
  '--y': `${(30 + rand(i, 2) * 75).toFixed(1)}%`,
  '--s': `${(0.45 + rand(i, 3) * 0.75).toFixed(2)}cqw`,
  '--dx': `${((rand(i, 4) - 0.5) * 14).toFixed(1)}cqw`,
  '--t': `${(7 + rand(i, 5) * 7).toFixed(1)}s`,
  '--d': `${(-rand(i, 6) * 14).toFixed(1)}s`,
}));

/** Recursion Hell: a dim 80s living room, Christmas lights over a painted alphabet. */
export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const uid = useId().replace(/:/g, '');
  const ids = useMemo<RoomIds>(
    () => ({
      paper: `st-paper-${uid}`,
      paperUp: `st-paperup-${uid}`,
      dark: `st-dark-${uid}`,
      darkUp: `st-darkup-${uid}`,
      glow: `st-glow-${uid}`,
      sheen: `st-sheen-${uid}`,
      mold: `st-mold-${uid}`,
    }),
    [uid],
  );

  const [phase, setPhase] = useState<Phase>('idle');
  const [lit, setLit] = useState<string | null>(null);
  const [upside, setUpside] = useState(false);
  const upsideRef = useRef(false);
  upsideRef.current = upside;

  useEffect(() => {
    if (reducedMotion || (visible && !active)) {
      setPhase('idle');
      setLit(null);
      setUpside(false);
      return;
    }
    // off screen: freeze where we are (CSS animations are paused too)
    if (!visible) return;
    if (upsideRef.current) {
      setPhase('upside');
      setLit(null);
      return;
    }

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    setPhase('spell');
    setLit(null);
    let t = LEAD_IN;
    for (const ch of MESSAGE) {
      at(t, () => setLit(ch));
      t += ON;
      at(t, () => setLit(null));
      t += OFF;
    }
    at(t, () => setPhase('flip'));
    at(t + FLIP / 2, () => setUpside(true));
    at(t + FLIP, () => setPhase('upside'));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [active, visible, reducedMotion]);

  const still = reducedMotion;
  const isUpside = upside && !still;
  const cls = [
    'st-scene',
    !still && phase === 'spell' && 'st-is-spelling',
    !still && phase === 'flip' && 'st-is-flipping',
    isUpside && 'st-is-upside',
    !visible && 'st-is-paused',
    still && 'st-is-still',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      <div className="st-room">
        {/*
          Every layer below is static inside; state changes only move opacity/transform of whole
          layers, which the compositor does without repainting the SVGs.
        */}
        <svg className="st-layer" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">
          <RoomDefs ids={ids} />
          <Room ids={ids} world="normal" depth={2} live />
        </svg>

        {!still && (
          <div className="st-layer st-upside">
            <svg className="st-layer" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">
              <Room ids={ids} world="upside" depth={2} live />
            </svg>
            {VINE_GROUPS.map((g, k) => (
              <svg
                key={k}
                className="st-layer st-vines"
                style={{ transformOrigin: g.origin, '--vd': `${0.3 + k * 0.35}s` } as CSSProperties}
                viewBox="0 0 160 100"
                preserveAspectRatio="xMidYMid slice"
              >
                <Vines group={k} />
              </svg>
            ))}
            <div className="st-layer st-upside__vignette" />
          </div>
        )}

        <div className="st-layer st-hush" />
        <svg className="st-layer st-title-halo" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">
          <TitleHalo glowId={ids.glow} />
        </svg>
        <svg className="st-layer" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">
          <TitleTubes />
        </svg>

        {/* the bulbs twinkle in three out-of-step sets: looks random, costs three layers instead of 26 */}
        <div className="st-lights">
          {TWINKLE_SETS.map((set) => (
            <div key={set} className="st-lights__set">
              {BULBS.filter((b) => b.i % TWINKLE_SETS.length === set).map((b) => (
                <span
                  key={b.ch}
                  className={`st-bulb${lit === b.ch ? ' st-bulb--lit' : ''}`}
                  style={
                    {
                      left: `${(b.x / 1.6).toFixed(2)}%`,
                      top: `${b.gy.toFixed(2)}%`,
                      '--c': b.color,
                    } as CSSProperties
                  }
                >
                  <span className="st-bulb__glow" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="st-redglow" />
      {isUpside && (
        <div className="st-spores">
          {SPORES.map((s, i) => (
            <span key={i} className="st-spore" style={s as CSSProperties} />
          ))}
        </div>
      )}
    </div>
  );
}
