import type { ThemeSceneProps } from '../../theme.ts';
import { createRng } from '../../../crayon/random.ts';
import { at, wobbly, wobblyEllipse, wobblyRect, type Pt } from '../../sketch.ts';
import './vision.css';

const rng = createRng(4242);
const chalk = (points: Pt[], amt = 0.45) => wobbly(points, rng, amt, 2);

const STAIRS = chalk([
  [140, 128],
  [140, 116],
  [152, 116],
  [152, 104],
  [164, 104],
  [164, 92],
  [176, 92],
  [176, 80],
  [188, 80],
  [188, 128],
  [140, 128],
]);
const RAIL = [
  chalk([
    [143, 104],
    [186, 67],
  ]),
  ...[
    [148, 99.7, 116],
    [160, 89.4, 104],
    [172, 79.1, 92],
    [184, 68.9, 80],
  ].map(([x, top, bottom]) =>
    chalk([
      [x!, top!],
      [x!, bottom!],
    ]),
  ),
].join('');
const CHAIR = [
  [
    [208, 75],
    [208, 128],
  ],
  [
    [213, 79],
    [213, 103],
  ],
  [
    [208, 104],
    [237, 104],
  ],
  [
    [208, 107.5],
    [237, 107.5],
  ],
  [
    [235, 107.5],
    [235, 128],
  ],
  [
    [208, 77],
    [214, 75.5],
  ],
]
  .map((line) => chalk(line as Pt[]))
  .join('');
const AXES = chalk([
  [28, 42],
  [28, 128],
  [128, 128],
]);
const TICKS = [48, 68, 88, 108].map((x) => `M${x} 128v3`).join('');
const LOSS = wobbly(
  [
    [32, 50],
    [40, 70],
    [50, 88],
    [62, 100],
    [78, 109],
    [96, 115],
    [116, 119],
    [124, 120],
  ],
  rng,
  0.3,
  2,
);
const SMUDGES = [
  wobblyEllipse(84, 62, 52, 20, rng, 0.08),
  wobblyEllipse(214, 112, 70, 24, rng, 0.08),
  wobblyEllipse(160, 36, 44, 10, rng, 0.08),
];

/** Everything that never moves, painted once. */
const ART = (
  <svg className="ish-art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" focusable="false">
    <rect width="320" height="200" fill="#e4d6b4" />
    <rect y="170" width="320" height="30" fill="#b98a58" />
    <path d={chalk([[0, 181], [320, 182]], 0.3) + chalk([[0, 192], [320, 191]], 0.3)} className="ish-plank" />

    {/* the board */}
    <path d={wobblyRect(8, 8, 304, 152, rng, 0.5)} className="ish-frame" />
    <rect x="14" y="14" width="292" height="139" rx="2" fill="#2f4b40" />
    {SMUDGES.map((d, i) => (
      <path key={i} d={d} fill="#fff" opacity="0.045" />
    ))}
    <path d={wobblyRect(18, 154, 284, 6, rng, 0.3)} className="ish-tray" />
    <rect x="40" y="150.5" width="11" height="3.2" rx="1.2" fill="#f3f1e7" />
    <rect x="55" y="151" width="8" height="2.7" rx="1.2" fill="#f6e27a" />
    <rect x="67" y="151" width="7" height="2.7" rx="1.2" fill="#f4a6c0" />
    <rect x="268" y="146.5" width="24" height="6" rx="1.5" fill="#d9d2c3" />
    <rect x="268" y="151" width="24" height="2.4" fill="#4a4744" />

    {/* chalk: the lesson */}
    <text x="186" y="34" className="ish-text ish-text--title">
      what is this?
    </text>
    <path d={AXES + TICKS} className="ish-chalk ish-chalk--soft" />
    <path d={AXES + TICKS} className="ish-chalk" />
    <path d={LOSS} className="ish-chalk ish-chalk--soft ish-chalk--yellow" />
    <path d={LOSS} className="ish-chalk ish-chalk--yellow" />
    <text x="21" y="92" transform="rotate(-90 21 92)" className="ish-text">
      loss
    </text>
    <text x="104" y="140" className="ish-text">
      epochs
    </text>
    <text x="64" y="58" className="ish-text">
      epoch 42
    </text>

    <path d={STAIRS + RAIL} className="ish-chalk ish-chalk--soft" />
    <path d={STAIRS + RAIL} className="ish-chalk" />
    <path d={CHAIR} className="ish-chalk ish-chalk--soft" />
    <path d={CHAIR} className="ish-chalk" />
    <text x="164" y="143" className="ish-text ish-text--blue">
      1.8 m away
    </text>

    {/* the student */}
    <rect x="269" y="123" width="8" height="7" fill="#9fb3c2" stroke="#3a3836" strokeWidth="1" />
    <path d={wobblyRect(252, 128, 44, 34, rng, 0.4)} className="ish-metal" />
    <rect x="262" y="135" width="24" height="12" rx="2" fill="#9fb3c2" />
    <circle cx="267" cy="141" r="2" fill="#e05a4f" />
    <circle cx="274" cy="141" r="2" fill="#f2c94c" />
    <circle cx="281" cy="141" r="2" fill="#5bbf7a" />
    {/* hand up: "I know this one!" */}
    <path d={chalk([[254, 139], [245, 128], [240, 116]], 0.2)} className="ish-arm-out" />
    <path d={chalk([[254, 139], [245, 128], [240, 116]], 0.2)} className="ish-arm" />
    <circle cx="239.5" cy="113" r="3.6" fill="#cfd8e0" stroke="#3a3836" strokeWidth="1.2" />
    <path d={chalk([[295, 140], [303, 155]], 0.2)} className="ish-arm-out" />
    <path d={chalk([[295, 140], [303, 155]], 0.2)} className="ish-arm" />

    <path d={wobblyRect(228, 156, 92, 44, rng, 0.4)} className="ish-desk" />
    <path d={wobblyRect(225, 152.5, 98, 6, rng, 0.3)} className="ish-desk-top" />
    <rect x="236" y="147.5" width="20" height="5" rx="1" fill="#f5f0e2" stroke="#3a3836" strokeWidth="0.8" />
    <path d="M260 151l14-3" stroke="#e8b931" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/** The robot's head turns while it thinks, so it's its own layer. */
const HEAD = (
  <svg viewBox="0 0 46 34" focusable="false">
    <path d="M23 9V2" stroke="#3a3836" strokeWidth="1.4" strokeLinecap="round" />
    <rect x="0" y="15" width="4" height="9" rx="1.5" fill="#9fb3c2" stroke="#3a3836" strokeWidth="1" />
    <rect x="42" y="15" width="4" height="9" rx="1.5" fill="#9fb3c2" stroke="#3a3836" strokeWidth="1" />
    <rect x="3" y="8.5" width="40" height="24" rx="6" fill="#cfd8e0" stroke="#3a3836" strokeWidth="1.4" />
    <circle cx="23" cy="20" r="8" fill="#2b3a46" />
    <circle cx="23" cy="20" r="4.6" fill="#5ec8ff" />
    <circle cx="21" cy="18" r="1.6" fill="#fff" />
    <path d="M12 28.5q11 3 22 0" fill="none" stroke="#3a3836" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

/** A dashed chalk box around a detected object, drawn in the box's own units. */
const detectBox = (w: number, h: number) => (
  <svg viewBox={`0 0 ${w} ${h}`} focusable="false">
    <path d={wobblyRect(1, 1, w - 2, h - 2, rng, 0.3)} className="ish-box-line" />
  </svg>
);
const STAIRS_BOX = detectBox(58, 74);
const CHAIR_BOX = detectBox(40, 62);

const STAR = (
  <svg viewBox="0 0 26 26" focusable="false">
    <path
      d="M13 1.5l3.3 7.2 7.8.8-5.9 5.3 1.7 7.7L13 18.6l-6.9 3.9 1.7-7.7L1.9 9.5l7.8-.8z"
      fill="#f2c94c"
      stroke="#b8860b"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
    <circle cx="10.5" cy="12" r="0.9" fill="#3a3836" />
    <circle cx="15.5" cy="12" r="0.9" fill="#3a3836" />
    <path d="M10.5 14.6q2.5 2 5 0" fill="none" stroke="#3a3836" strokeWidth="0.9" strokeLinecap="round" />
  </svg>
);

/**
 * Ishara: a robot student learning to see. Idle, it's the finished lesson: a falling loss curve,
 * stairs and a chair boxed and labelled, a gold star. Active, the robot's camera sweeps the board, the
 * boxes pop in one by one, it guesses "cat?" for the chair before getting it right, and the loss dot
 * slides down the curve. Only small HTML layers move, with transform/opacity.
 */
export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const live = active && visible && !reducedMotion;

  return (
    <div className={`ish-scene${live ? ' ish-live' : ''}`}>
      {ART}
      <div className="ish-at ish-beam" style={at(123, 77, 150, 70)} />
      <div className="ish-at ish-box ish-box--stairs" style={at(136, 58, 58, 74)}>
        {STAIRS_BOX}
      </div>
      <div className="ish-at ish-box ish-box--chair" style={at(202, 70, 40, 62)}>
        {CHAIR_BOX}
      </div>
      <span className="ish-at ish-tag ish-tag--stairs" style={at(130, 47, 70, 10)}>
        stairs · 93%
      </span>
      <span className="ish-at ish-tag ish-tag--wrong" style={at(192, 59, 60, 10)}>
        cat? ✗
      </span>
      <span className="ish-at ish-tag ish-tag--chair" style={at(192, 59, 60, 10)}>
        chair · 88%
      </span>
      <span className="ish-at ish-dot" style={at(121.5, 117.5, 5, 5)} />
      <div className="ish-at ish-star" style={at(98, 38, 26, 26)}>
        {STAR}
      </div>
      <div className="ish-at ish-head" style={at(250, 92, 46, 34)}>
        {HEAD}
      </div>
      <span className="ish-at ish-light" style={at(270, 90, 6, 6)} />
    </div>
  );
}
