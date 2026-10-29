import { memo, useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { crayonPasses, grainTile, type Stroke } from './brush.ts';
import { toolCursor } from './cursors.ts';
import type { Scribbles } from './useScribbles.ts';

interface SurfaceProps {
  sb: Scribbles;
  /** Drawing is on: the surface takes the pointer (and stops touch scrolling). */
  active: boolean;
  className?: string;
  style?: CSSProperties;
}

const StrokeView = memo(function StrokeView({ stroke }: { stroke: Stroke }) {
  return (
    <g stroke={stroke.c}>
      {crayonPasses(stroke).map((pass, i) => (
        <path key={i} d={pass.d} strokeWidth={pass.width} strokeOpacity={pass.opacity} />
      ))}
    </g>
  );
});

/**
 * Where scribbles are drawn and shown. Points are stored from the surface's centre line, so the
 * drawings stay with the content when the window is resized. Strokes are plain SVG: scrolling the
 * page never redraws them, and only the stroke being drawn re-renders while the pointer moves.
 */
export function ScribbleSurface({ sb, active, className, style }: SurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const [width, setWidth] = useState(0);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const drawing = useRef<Stroke | null>(null);
  const uid = useId().replace(/:/g, '');
  const [tile] = useState(grainTile);
  const erasing = sb.tool === 'eraser';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const point = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [Math.round(e.clientX - r.left - r.width / 2), Math.round(e.clientY - r.top)] as const;
  };

  /** The eraser's reach follows the pointer as a faint ring (set directly: no re-render per move). */
  const moveRing = (x: number, y: number) => {
    ringRef.current?.setAttribute('cx', String(x));
    ringRef.current?.setAttribute('cy', String(y));
  };

  const down = (e: PointerEvent) => {
    if (!active || e.button > 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = point(e);
    if (erasing) {
      sb.eraseStart();
      sb.eraseAt(x, y);
      return;
    }
    drawing.current = { c: sb.colour, s: sb.size, p: [x, y] };
    setCurrent({ ...drawing.current });
  };

  const move = (e: PointerEvent) => {
    if (!active) return;
    const [x, y] = point(e);
    if (erasing) moveRing(x, y);
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (erasing) return sb.eraseAt(x, y);
    const stroke = drawing.current;
    if (!stroke) return;
    const lx = stroke.p[stroke.p.length - 2]!;
    const ly = stroke.p[stroke.p.length - 1]!;
    if ((x - lx) ** 2 + (y - ly) ** 2 < 6) return; // skip tiny jitters: fewer points, smoother line
    stroke.p.push(x, y);
    setCurrent({ ...stroke, p: stroke.p.slice() });
  };

  const up = () => {
    const stroke = drawing.current;
    drawing.current = null;
    setCurrent(null);
    if (stroke) sb.add(stroke);
  };

  return (
    <div
      ref={ref}
      className={['scribble-surface', active ? 'is-active' : '', className].filter(Boolean).join(' ')}
      style={active ? { ...style, cursor: toolCursor(sb) } : style}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={() => moveRing(-9999, -9999)}
      aria-hidden="true"
    >
      <svg className="scribble-surface__svg">
        <defs>
          <pattern id={`${uid}-grain`} width="96" height="96" patternUnits="userSpaceOnUse">
            <image href={tile} width="96" height="96" />
          </pattern>
          <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse" x="-50000" y="-100" width="100000" height="200000">
            <rect x="-50000" y="-100" width="100000" height="200000" fill={`url(#${uid}-grain)`} />
          </mask>
        </defs>
        <g transform={`translate(${width / 2} 0)`}>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" mask={`url(#${uid}-mask)`}>
            {sb.strokes.map((s, i) => (
              <StrokeView key={i} stroke={s} />
            ))}
            {current && <StrokeView stroke={current} />}
          </g>
          {active && erasing && (
            <circle ref={ringRef} cx="-9999" cy="-9999" r={sb.eraserRadius} className="scribble-surface__ring" />
          )}
        </g>
      </svg>
    </div>
  );
}
