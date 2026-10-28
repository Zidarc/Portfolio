/**
 * The paint program's window, drawn once in crayon: title bar, menu bar, tool box, colour
 * palette and status bar. Everything that moves lives in HTML layers on top (Scene.tsx),
 * so this SVG never repaints while the scene is animating.
 */
import { memo } from 'react';
import { createRng, type Rng } from '../../../crayon/random.ts';

/* ---------- layout, in scene units (the scene is a 320 x 200 viewBox) ---------- */

export const CANVAS = { x: 56, y: 36, w: 240, h: 125 };
export const MENU_LABELS = [
  { text: 'File', x: 11 },
  { text: 'Edit', x: 31 },
  { text: 'View', x: 51 },
  { text: 'Image', x: 72 },
  { text: 'Filters', x: 97 },
  { text: 'Help', x: 127 },
];
const TOOL_X = [9, 23];
const TOOL_Y = (row: number) => 34 + row * 13.5;
const SWATCHES = [
  '#3a3836', '#8d8a85', '#7a4a2e', '#d6453d', '#ea7a2c', '#e8b931', '#3f9a4f',
  '#2f8f8a', '#3a6fc4', '#7b52ab', '#f07aa8', '#a6d4f2', '#c9e7b5', '#fbfaf4',
  '#ffffff', '#c9c5bd', '#c08a5a', '#f19a94', '#f7c08a', '#fde68a', '#7cc463',
  '#8fd3cf', '#8fb3ea', '#b49ad8', '#f8c4da', '#e3c48f', '#5a3a1c', '#1f2a44',
];

/* ---------- crayon geometry ---------- */

const f = (n: number) => n.toFixed(2);

function wobbly(points: [number, number][], rng: Rng, amp = 0.45) {
  let d = '';
  points.forEach(([x, y], i) => {
    if (i === 0) {
      d += `M${f(x + (rng() - 0.5) * amp)} ${f(y + (rng() - 0.5) * amp)}`;
      return;
    }
    const [px, py] = points[i - 1]!;
    const len = Math.hypot(x - px, y - py) || 1;
    const nx = -(y - py) / len;
    const ny = (x - px) / len;
    const steps = Math.max(1, Math.round(len / 12));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const w = (rng() * 2 - 1) * amp;
      d += `L${f(px + (x - px) * t + nx * w)} ${f(py + (y - py) * t + ny * w)}`;
    }
  });
  return d;
}

/** A hand-drawn box: four wobbly sides that overshoot a little at the start, like one crayon stroke. */
const box = (x1: number, y1: number, x2: number, y2: number, rng: Rng, amp = 0.45) =>
  wobbly(
    [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
      [x1, y1 - 0.3],
      [x1 + 2.2, y1 - 0.4],
    ],
    rng,
    amp,
  );

/** Raised (or pressed) 3D button edge, in crayon: light top-left, dark bottom-right. */
function bevel(x1: number, y1: number, x2: number, y2: number, rng: Rng) {
  return {
    light: wobbly([[x1, y2], [x1, y1], [x2, y1]], rng, 0.25),
    dark: wobbly([[x2, y1], [x2, y2], [x1, y2]], rng, 0.25),
  };
}

const G = (() => {
  const rng = createRng(1990);
  const tools = Array.from({ length: 10 }, (_, i) => {
    const x = TOOL_X[i % 2]!;
    const y = TOOL_Y(Math.floor(i / 2));
    return { x, y, ...bevel(x, y, x + 12, y + 12, rng) };
  });
  return {
    window: box(4.5, 4.5, 315.5, 195.5, rng, 0.6),
    titleEdge: wobbly([[6, 19.5], [314, 19.5]], rng, 0.35),
    menuEdge: wobbly([[6, 30.5], [314, 30.5]], rng, 0.35),
    toolPanel: bevel(7, 32, 37, 131, rng),
    tools,
    options: box(9.5, 102.5, 34.5, 128.5, rng, 0.3),
    workspace: box(40, 32, 313, 165.5, rng, 0.4),
    canvasEdge: box(CANVAS.x - 0.6, CANVAS.y - 0.6, CANVAS.x + CANVAS.w + 0.6, CANVAS.y + CANVAS.h + 0.6, rng, 0.35),
    current: [box(10, 169, 20, 178, rng, 0.25), box(15, 174, 25, 183, rng, 0.25)],
    swatches: SWATCHES.map((c, i) => {
      const x = 30 + (i % 14) * 11.4;
      const y = i < 14 ? 168.8 : 177;
      return { c, d: box(x, y, x + 10, y + 7.2, rng, 0.25) };
    }),
    status: [bevel(7, 187, 206, 195, rng), bevel(209, 187, 313, 195, rng)],
    winButtons: [280, 291.5, 303].map((x) => ({ x, ...bevel(x, 8, x + 9.5, 17, rng) })),
    noteArrow: wobbly([[232, 177], [222, 178.5], [209, 176.5]], rng, 0.4) + wobbly([[212.5, 173.6], [208.6, 176.5], [212.8, 179.4]], rng, 0.2),
  };
})();

/* ---------- tool icons (12 x 12 buttons, drawn at the button's origin) ---------- */

function ToolIcon({ i }: { i: number }) {
  switch (i) {
    case 0: // select
      return <rect x="2.6" y="3" width="7" height="6" className="pt-ico-dash" />;
    case 1: // eraser
      return (
        <g transform="rotate(-35 6 6)">
          <rect x="2" y="4" width="8" height="4.4" rx="0.6" fill="#f8b4c8" className="pt-ico" />
          <path d="M6 4V8.4" className="pt-ico" />
        </g>
      );
    case 2: // bucket
      return (
        <g>
          <path d="M3 5.2L6.2 2.6L9.4 6L6.2 9.4Z" fill="#c9c5bd" className="pt-ico" />
          <path d="M3.2 5.4Q2 7.5 2.4 9.2" className="pt-ico-thin" stroke="#3a6fc4" />
          <circle cx="2.5" cy="9.8" r="0.9" fill="#3a6fc4" />
        </g>
      );
    case 3: // spray can
      return (
        <g>
          <rect x="5.5" y="4.8" width="4" height="5.8" rx="0.6" fill="#8fb3ea" className="pt-ico" />
          <rect x="6.6" y="3" width="1.8" height="1.8" className="pt-ico-thin" />
          {[[3.6, 2.6], [2.4, 4], [3.8, 4.6], [2, 2.4], [2.8, 5.8]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="0.45" className="pt-ico-dot" />
          ))}
        </g>
      );
    case 4: // pencil
      return (
        <g>
          <path d="M3.2 9.6L4 7.4L8.6 2.8L10 4.2L5.4 8.8Z" fill="#e8b931" className="pt-ico" />
          <path d="M3.2 9.6L4 7.4L5.4 8.8Z" fill="#3a3836" />
        </g>
      );
    case 5: // brush
      return (
        <g>
          <path d="M9.6 2.4L5.8 6.6" className="pt-ico" strokeWidth="1.4" stroke="#8b5a2b" />
          <path d="M5.8 6.6Q3.6 6.8 3 9.8Q5.6 9.6 6.4 7.4Z" fill="#7b52ab" className="pt-ico-thin" />
        </g>
      );
    case 6: // line
      return <path d="M2.6 9.4L9.6 2.6" className="pt-ico" strokeWidth="1.2" />;
    case 7: // rectangle
      return <rect x="2.6" y="3.4" width="7" height="5.4" className="pt-ico" fill="none" />;
    case 8: // ellipse
      return <ellipse cx="6" cy="6" rx="3.6" ry="2.7" className="pt-ico" fill="none" />;
    default: // text
      return (
        <text x="6" y="9.3" textAnchor="middle" className="pt-ico-text">
          A
        </text>
      );
  }
}

/** Which tool is pressed in. */
const PENCIL = 4;

export const Chrome = memo(function Chrome({ uid }: { uid: string }) {
  return (
    <svg className="pt-chrome" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <pattern id={`${uid}-desk`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <rect width="4" height="4" fill="#3e8e8a" />
          <path d="M0 1H4" stroke="#4fa19c" strokeWidth="1.1" />
        </pattern>
        <pattern id={`${uid}-title`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">
          <rect width="3" height="3" fill="#8a66bb" />
          <path d="M0 1H3" stroke="#6d47a1" strokeWidth="1.2" />
        </pattern>
        <pattern id={`${uid}-work`} width="3.5" height="3.5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="3.5" height="3.5" fill="#9fa19b" />
          <path d="M0 1H3.5" stroke="#92948e" strokeWidth="1" />
        </pattern>
      </defs>

      {/* desktop and window body */}
      <rect width="320" height="200" fill={`url(#${uid}-desk)`} />
      <rect x="4.5" y="4.5" width="311" height="191" className="pt-body" />

      {/* title bar */}
      <rect x="6" y="6" width="308" height="13.5" fill={`url(#${uid}-title)`} />
      <g transform="translate(9 7.6)">
        <path d="M5 0.6C8.6 0.6 10.4 3 9.6 5.4C9 7.2 6.8 6.4 6.2 7.6C5.6 9 3.6 10 1.8 8.4C-0.4 6.4 0.6 0.6 5 0.6Z" fill="#f4ead2" className="pt-ico-thin" />
        <circle cx="3.2" cy="3.6" r="1.05" fill="#d6453d" />
        <circle cx="5.8" cy="2.6" r="1.05" fill="#3a6fc4" />
        <circle cx="7.9" cy="4.3" r="1" fill="#e8b931" />
      </g>
      <text x="22" y="15.9" className="pt-title">
        untitled.bmp – Crayon Paint
      </text>
      {G.winButtons.map((b, i) => (
        <g key={b.x}>
          <rect x={b.x} y="8" width="9.5" height="9" className="pt-btn" />
          <path d={b.light} className="pt-bevel-light" />
          <path d={b.dark} className="pt-bevel-dark" />
          <path
            d={
              i === 0
                ? `M${b.x + 2.4} 14.6H${b.x + 6.6}`
                : i === 1
                  ? `M${b.x + 2.4} 10.4H${b.x + 7.1}V14.8H${b.x + 2.4}Z`
                  : `M${b.x + 2.6} 10.3L${b.x + 6.9} 14.7M${b.x + 6.9} 10.3L${b.x + 2.6} 14.7`
            }
            className="pt-ico"
            fill="none"
          />
        </g>
      ))}
      <path d={G.titleEdge} className="pt-line" />

      {/* menu bar */}
      {MENU_LABELS.map((m) => (
        <text key={m.text} x={m.x} y="27.4" className="pt-menu-label">
          <tspan className="pt-menu-key">{m.text[0]}</tspan>
          {m.text.slice(1)}
        </text>
      ))}
      <path d={G.menuEdge} className="pt-line pt-line--soft" />

      {/* tool box */}
      <path d={G.toolPanel.light} className="pt-bevel-light" />
      <path d={G.toolPanel.dark} className="pt-bevel-dark" />
      {G.tools.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y})`}>
          <rect width="12" height="12" className={i === PENCIL ? 'pt-btn pt-btn--down' : 'pt-btn'} />
          <g transform={`translate(${-t.x} ${-t.y})`}>
            <path d={i === PENCIL ? t.dark : t.light} className="pt-bevel-light" />
            <path d={i === PENCIL ? t.light : t.dark} className="pt-bevel-dark" />
          </g>
          <g transform={i === PENCIL ? 'translate(0.4 0.4)' : undefined}>
            <ToolIcon i={i} />
          </g>
        </g>
      ))}
      {/* brush sizes */}
      <path d={G.options} className="pt-line pt-line--soft" fill="#e9e5db" />
      <circle cx="16" cy="108" r="0.8" className="pt-ico-dot" />
      <circle cx="22" cy="108" r="1.3" className="pt-ico-dot" />
      <circle cx="28.5" cy="108" r="1.9" className="pt-ico-dot" />
      <path d="M14 115.5H30" className="pt-ico" />
      <path d="M14 120.5H30" className="pt-ico" strokeWidth="1.6" />
      <path d="M14 125.3H30" className="pt-ico" strokeWidth="2.4" />
      <rect x="11.6" y="104.4" width="7.4" height="7.4" className="pt-ico-sel" />

      {/* workspace + white canvas (the picture itself is an HTML canvas layered on top) */}
      <path d={G.workspace} fill={`url(#${uid}-work)`} className="pt-line pt-line--soft" />
      <rect x={CANVAS.x + 1.6} y={CANVAS.y + 1.8} width={CANVAS.w} height={CANVAS.h} className="pt-canvas-shadow" />
      <rect x={CANVAS.x} y={CANVAS.y} width={CANVAS.w} height={CANVAS.h} fill="#fdfcf7" />
      <path d={G.canvasEdge} className="pt-line" />
      {[
        [CANVAS.x + CANVAS.w, CANVAS.y + CANVAS.h / 2],
        [CANVAS.x + CANVAS.w / 2, CANVAS.y + CANVAS.h],
        [CANVAS.x + CANVAS.w, CANVAS.y + CANVAS.h],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x! + 0.8} y={y! + 0.8} width="2.6" height="2.6" className="pt-handle" />
      ))}

      {/* colour palette */}
      <path d={G.current[1]} fill="#fbfaf4" className="pt-line pt-line--thin" />
      <path d={G.current[0]} fill="#7b52ab" className="pt-line pt-line--thin" />
      {G.swatches.map((s) => (
        <path key={s.c} d={s.d} fill={s.c} className="pt-line pt-line--thin" />
      ))}
      <path d={G.swatches[9]!.d} className="pt-swatch-pick" transform="translate(0 0)" />
      <text x="236" y="180.8" className="pt-note">
        pick a colour!
      </text>
      <path d={G.noteArrow} className="pt-note-arrow" />

      {/* status bar */}
      {G.status.map((s, i) => (
        <g key={i}>
          <path d={s.dark} className="pt-bevel-light" />
          <path d={s.light} className="pt-bevel-dark" />
        </g>
      ))}
      <text x="306" y="193.6" textAnchor="end" className="pt-status-text">
        48 x 25 px · 24-bit BMP
      </text>

      <path d={G.window} className="pt-line pt-line--frame" />
    </svg>
  );
});
