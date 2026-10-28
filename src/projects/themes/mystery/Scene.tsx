import type { ThemeSceneProps } from '../../theme.ts';
import { createRng } from '../../../crayon/random.ts';
import { at, wobbly, wobblyRect } from '../../sketch.ts';
import './mystery.css';

const rng = createRng(1337);

/**
 * The covered thing on the pedestal. Its lower-right corner is a separate flap (178,102)-(194,108)-
 * (196,124)-(168,124) that lifts when the box is active, so the cloth here stops at the flap's edges.
 */
const OUTLINE =
  'M124 124C124 104 126 82 134 72C140 62 152 60 158 68C161 72 162 76 164 76C168 70 180 66 186 76' +
  'C192 86 193 98 194 108';
const HEM = 'M168 124Q160 127 152 124Q144 121 136 124Q130 126 124 124';
const CLOTH = `${OUTLINE}L178 102L168 124${HEM.replace('M168 124', '')}Z`;
const FOLDS = [
  wobbly([[140, 76], [138, 98], [140, 122]], rng, 0.4),
  wobbly([[156, 72], [154, 96], [157, 121]], rng, 0.4),
  wobbly([[176, 76], [180, 92], [176, 104]], rng, 0.4),
].join('');

const ART = (
  <svg className="my-art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" focusable="false">
    <defs>
      <radialGradient id="my7-room" cx="0.5" cy="0.45" r="0.7">
        <stop offset="0" stopColor="#2e2650" />
        <stop offset="1" stopColor="#120f1f" />
      </radialGradient>
    </defs>
    <rect width="320" height="200" fill="url(#my7-room)" />
    <rect y="150" width="320" height="50" fill="#2a2340" />
    <path d={wobbly([[0, 150], [320, 151]], rng, 0.4)} stroke="#43395f" strokeWidth="1.4" fill="none" />

    {/* scribbled question marks on the wall */}
    <text x="58" y="108" className="my-scribble">
      ?
    </text>
    <text x="250" y="70" className="my-scribble my-scribble--small">
      ?
    </text>
    <text x="276" y="132" className="my-scribble">
      ?
    </text>

    {/* the spotlight fixture */}
    <rect x="148" y="-2" width="24" height="9" rx="2" fill="#3b3456" stroke="#0e0b18" strokeWidth="1" />
    <rect x="152" y="6" width="16" height="3" fill="#fff4c2" />

    {/* pedestal */}
    <path d={wobblyRect(122, 122, 76, 8, rng, 0.3)} className="my-stone my-stone--top" />
    <path d={wobblyRect(130, 130, 60, 36, rng, 0.3)} className="my-stone" />
    <path d={wobblyRect(124, 164, 72, 6, rng, 0.3)} className="my-stone my-stone--top" />
    <text x="160" y="142" className="my-text">
      building…
    </text>
    <rect x="138" y="147" width="44" height="5" rx="1.5" fill="#2b2540" stroke="#0e0b18" strokeWidth="0.6" />

    {/* what's under the flap, and the sheet over everything else */}
    <path d="M178 102L194 108L196 124L168 124Z" fill="#221d36" />
    {/* filled without a stroke: only the real outer edges are outlined, so the flap joins seamlessly */}
    <path d={CLOTH} className="my-cloth" />
    <path d={FOLDS} className="my-fold" />
    <path d={OUTLINE + HEM} className="my-cloth-edge" />

    {/* the folder on the floor */}
    <g transform="rotate(-7 58 170)">
      <path d="M22 150h20l4-6h22l2 6h20v40H22z" fill="#c99a52" stroke="#5e4220" strokeWidth="1.1" />
      <rect x="22" y="152" width="70" height="38" fill="#d9b36c" stroke="#5e4220" strokeWidth="1.1" />
      <text x="57" y="184" className="my-text my-text--folder">
        TOP SECRET
      </text>
    </g>

    {/* caution tape */}
    <g transform="rotate(-24 284 182)">
      <rect x="226" y="176" width="130" height="12" fill="#f2c94c" stroke="#3a3836" strokeWidth="0.8" />
      <text x="232" y="185" className="my-text my-text--tape">
        DO NOT PEEK · DO NOT PEEK · DO NOT
      </text>
    </g>
  </svg>
);

const FLAP = (
  <svg viewBox="0 0 32 26" focusable="false">
    <path d="M12 2L28 8L30 24L2 24Z" className="my-cloth" />
    <path d="M14 6Q18 14 16 22" className="my-fold" />
    <path d="M28 8L30 24L2 24" className="my-cloth-edge" />
  </svg>
);

const EYES = (
  <svg viewBox="0 0 28 10" focusable="false">
    <ellipse cx="7" cy="5" rx="5.5" ry="4" fill="#f5f2ff" />
    <ellipse cx="21" cy="5" rx="5.5" ry="4" fill="#f5f2ff" />
    <circle cx="8.5" cy="5.5" r="2.2" fill="#120f1f" />
    <circle cx="22.5" cy="5.5" r="2.2" fill="#120f1f" />
  </svg>
);

const MARKS = [
  { x: 100, y: 64, c: '#f2c94c', d: '0s' },
  { x: 208, y: 50, c: '#f4a6c0', d: '-1.2s' },
  { x: 222, y: 104, c: '#7fe0ff', d: '-2.4s' },
];

/**
 * Project ???: something under a sheet in a spotlight. Idle, everything is hushed: the sheet is down,
 * the folder is stamped, a pair of eyes watches from the dark. Active, the spotlight sways, a corner of
 * the sheet lifts on a glow, question marks float up, the eyes look around and blink, the stamp thumps
 * and the progress bar creeps along without ever finishing.
 */
export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const live = active && visible && !reducedMotion;

  return (
    <div className={`my-scene${live ? ' my-live' : ''}`}>
      {ART}
      <div className="my-at my-pool" style={at(90, 158, 140, 24)} />
      <div className="my-at my-progress" style={at(138.6, 147.6, 42.8, 3.8)} />
      <div className="my-at my-glow" style={at(160, 96, 46, 36)} />
      <div className="my-at my-flap" style={at(166, 100, 32, 26)}>
        {FLAP}
      </div>
      {/* the light goes over the sheet and its flap alike, so the flap doesn't stand out */}
      <div className="my-at my-cone" style={at(80, 6, 160, 162)} />
      {MARKS.map((m) => (
        <span key={m.x} className="my-at my-mark" style={at(m.x, m.y, 16, 22, { '--c': m.c, '--d': m.d })}>
          ?
        </span>
      ))}
      <div className="my-at my-eyes" style={at(34, 44, 28, 10)}>
        <div className="my-eyes__blink">{EYES}</div>
      </div>
      <span className="my-at my-stamp" style={at(28, 154, 56, 13)}>
        CLASSIFIED
      </span>
    </div>
  );
}
