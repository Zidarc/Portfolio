import type { ThemeSceneProps } from '../../theme.ts';
import { createRng } from '../../../crayon/random.ts';
import { at, wobbly, wobblyEllipse, wobblyRect } from '../../sketch.ts';
import './mission-control.css';

const rng = createRng(7007);

/** The planet sits at (120, 82) with radius 46; the satellite's orbit is a 70 x 16 ellipse round it. */
const STARS = Array.from({ length: 34 }, () => ({
  x: 16 + rng() * 188,
  y: 16 + rng() * 130,
  r: 0.4 + rng() * 0.8,
}));
const DUNES = [
  wobbly([[80, 66], [92, 62], [104, 66]], rng, 0.4),
  wobbly([[78, 92], [90, 88], [106, 93]], rng, 0.4),
  wobbly([[86, 108], [98, 104], [108, 108]], rng, 0.4),
].join('');
const ICE = [wobblyEllipse(146, 44, 14, 6, rng, 0.1), wobblyEllipse(150, 122, 13, 5, rng, 0.1)];
const CRATERS = [wobblyEllipse(146, 80, 4, 3.5, rng), wobblyEllipse(156, 98, 2.6, 2.4, rng), wobblyEllipse(98, 78, 3, 2.6, rng)];

const ART = (
  <svg className="ast-art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" focusable="false">
    <defs>
      <clipPath id="ast7-screen">
        <rect x="12" y="12" width="196" height="138" rx="8" />
      </clipPath>
      <clipPath id="ast7-planet">
        <circle cx="120" cy="82" r="46" />
      </clipPath>
      <radialGradient id="ast7-star" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffe3a3" />
        <stop offset="0.55" stopColor="#ffa25c" />
        <stop offset="1" stopColor="#ff6a3d" />
      </radialGradient>
      <radialGradient id="ast7-shade" cx="0.22" cy="0.4" r="0.85">
        <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.38" />
      </radialGradient>
    </defs>

    <rect width="320" height="200" fill="#121a2b" />

    {/* the big screen */}
    <path d={wobblyRect(8, 8, 204, 146, rng, 0.5)} className="ast-bezel" />
    <g clipPath="url(#ast7-screen)">
      <rect x="12" y="12" width="196" height="138" fill="#070b18" />
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#dfe8ff" opacity={0.35 + (i % 3) * 0.2} />
      ))}
      <circle cx="14" cy="82" r="30" fill="url(#ast7-star)" />
      <path d="M50 82A70 16 0 0 1 190 82" className="ast-orbit" />
      <g clipPath="url(#ast7-planet)">
        <rect x="74" y="36" width="92" height="92" fill="#35558f" />
        <rect x="74" y="36" width="46" height="92" fill="#e8913f" />
        <ellipse cx="120" cy="82" rx="13" ry="50" fill="#5fb877" />
        <ellipse cx="120" cy="82" rx="5.5" ry="50" fill="#86d696" />
        <path d={DUNES} className="ast-dunes" />
        {ICE.map((d, i) => (
          <path key={i} d={d} fill="#e6f0ff" />
        ))}
        {CRATERS.map((d, i) => (
          <path key={i} d={d} className="ast-crater" />
        ))}
        <circle cx="120" cy="82" r="46" fill="url(#ast7-shade)" />
      </g>
      <circle cx="120" cy="82" r="47.6" className="ast-atmo" />
      <path d={wobblyEllipse(120, 82, 46, 46, rng, 0.012)} className="ast-outline" />
      <path d="M50 82A70 16 0 0 0 190 82" className="ast-orbit" />
      <text x="22" y="26" className="ast-text ast-text--screen">
        LIVE · tidally locked: one side always faces its star
      </text>
      <text x="22" y="143" className="ast-text ast-text--day">
        day side
      </text>
      <text x="198" y="143" className="ast-text ast-text--night ast-text--end">
        night side
      </text>
    </g>

    {/* telemetry */}
    <path d={wobblyRect(214, 8, 100, 146, rng, 0.5)} className="ast-bezel" />
    <rect x="218" y="12" width="92" height="138" rx="5" fill="#0b1324" />
    <text x="224" y="28" className="ast-text ast-text--title">
      ASTRALIS-7
    </text>
    <text x="224" y="44" className="ast-text">
      orbit: locked
    </text>
    <text x="224" y="56" className="ast-text ast-text--day">
      day: 410 K
    </text>
    <text x="224" y="68" className="ast-text ast-text--night">
      night: 90 K
    </text>
    <text x="224" y="80" className="ast-text ast-text--zone">
      twilight: 288 K ✓
    </text>
    <text x="224" y="92" className="ast-text">
      life:
    </text>
    <circle cx="263" cy="124" r="21" className="ast-radar" />
    <circle cx="263" cy="124" r="13" className="ast-radar" />
    <circle cx="263" cy="124" r="5" className="ast-radar" />
    <path d="M242 124h42M263 103v42" className="ast-radar" />

    {/* the desk */}
    <rect y="154" width="320" height="10" fill="#3b4a6b" />
    <rect y="164" width="320" height="36" fill="#25304a" />
    <path d={wobbly([[0, 164], [320, 164]], rng, 0.3)} className="ast-edge" />
    {[132, 146, 160, 174, 188].map((x, i) => (
      <rect key={x} x={x} y="170" width="10" height="6" rx="1.5" fill={['#e05a4f', '#f2c94c', '#5bbf7a', '#6fa8ff', '#f2c94c'][i]} />
    ))}
    <path d="M134 188h56" stroke="#11182a" strokeWidth="2.4" strokeLinecap="round" />
    <rect x="144" y="185" width="5" height="6" rx="1" fill="#cfd8e0" />
    <rect x="170" y="185" width="5" height="6" rx="1" fill="#cfd8e0" />
    <circle cx="236" cy="178" r="8.5" fill="#7a1f1a" />
    <circle cx="236" cy="176.5" r="7.5" fill="#e05a4f" />
    <text x="236" y="195" className="ast-text ast-text--tiny">
      don't press
    </text>
    <path d={wobblyRect(286, 160, 14, 16, rng, 0.3)} fill="#f2f2f2" stroke="#3a3836" strokeWidth="1" />
    <path d="M300 164q6 0 6 5t-6 5" fill="none" stroke="#3a3836" strokeWidth="1.4" />
    <circle cx="28" cy="180" r="13" fill="#1c3f8f" stroke="#e8eef8" strokeWidth="1.5" />
    <path d="M18 184q10-10 20-8" fill="none" stroke="#e05a4f" strokeWidth="1.6" strokeLinecap="round" />
    <text x="28" y="179" className="ast-text ast-text--patch">
      SPACE APPS
    </text>
    <text x="28" y="186" className="ast-text ast-text--patch">
      2023
    </text>

    {/* the person on shift, seen from behind */}
    <path d="M56 200q2-24 30-26q28 2 30 26z" fill="#3a6fc4" stroke="#1b2a4a" strokeWidth="1.2" />
    <circle cx="86" cy="162" r="13" fill="#2b2320" />
    <path d="M73 160q13-18 26 0" fill="none" stroke="#9aa4b8" strokeWidth="2.6" strokeLinecap="round" />
    <rect x="70" y="158" width="5" height="9" rx="2" fill="#5b6478" />
    <path d="M72 166q-2 8 6 10" fill="none" stroke="#5b6478" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const SATELLITE = (
  <svg viewBox="0 0 16 8" focusable="false">
    <rect x="0" y="2.5" width="5" height="3" fill="#6fa8ff" stroke="#dfe8ff" strokeWidth="0.5" />
    <rect x="11" y="2.5" width="5" height="3" fill="#6fa8ff" stroke="#dfe8ff" strokeWidth="0.5" />
    <rect x="5" y="1.5" width="6" height="5" rx="1" fill="#e8eef8" stroke="#9aa4b8" strokeWidth="0.5" />
    <circle cx="8" cy="4" r="1" fill="#f2c94c" />
  </svg>
);
const RETICLE = (
  <svg viewBox="0 0 36 64" focusable="false">
    <path d="M1 9V1h8M27 1h8v8M35 55v8h-8M9 63H1v-8" className="ast-reticle" />
  </svg>
);
const LIGHTS = (xs: number[]) => (
  <svg viewBox="0 0 60 6" focusable="false">
    {xs.map((x) => (
      <circle key={x} cx={x} cy="3" r="2.2" fill="#7dffa8" />
    ))}
  </svg>
);
const LIGHTS_A = LIGHTS([3, 23, 43]);
const LIGHTS_B = LIGHTS([13, 33, 53]);

/**
 * Astralis-7 (NASA Space Apps 2023): mission control watching a tidally-locked exoplanet. Idle, the
 * scan is done: the twilight band is marked habitable and life reads "maybe!". Active, a satellite
 * orbits (the planet's face never turns), the radar sweeps and pings, the scanner slides in from the
 * star side and locks on the habitable band, and "life: ???" becomes "maybe!".
 */
export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const live = active && visible && !reducedMotion;

  return (
    <div className={`ast-scene${live ? ' ast-live' : ''}`}>
      {ART}
      <div className="ast-at ast-glow" style={at(-38, 30, 104, 104)} />
      <div className="ast-at ast-sat" style={at(112, 78, 16, 8)}>
        <div className="ast-sat__x">
          <div className="ast-sat__y">{SATELLITE}</div>
        </div>
      </div>
      <div className="ast-at ast-reticle-box" style={at(102, 50, 36, 64)}>
        {RETICLE}
      </div>
      <span className="ast-at ast-zone" style={at(80, 132, 80, 10)}>
        HABITABLE ZONE
      </span>
      <span className="ast-at ast-life ast-life--unknown" style={at(244, 85, 50, 10)}>
        ???
      </span>
      <span className="ast-at ast-life ast-life--maybe" style={at(244, 85, 50, 10)}>
        maybe!
      </span>
      <div className="ast-at ast-sweep" style={at(242, 103, 42, 42)} />
      <span className="ast-at ast-blip ast-blip--1" style={at(270, 113, 4, 4)} />
      <span className="ast-at ast-blip ast-blip--2" style={at(251, 128, 4, 4)} />
      <div className="ast-at ast-lights ast-lights--a" style={at(130, 179, 60, 6)}>
        {LIGHTS_A}
      </div>
      <div className="ast-at ast-lights ast-lights--b" style={at(130, 179, 60, 6)}>
        {LIGHTS_B}
      </div>
    </div>
  );
}
