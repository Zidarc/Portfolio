import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { CrayonFilter } from './CrayonFilter.tsx';
import type { CrayonPlan } from './strokes.ts';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.ts';
import './crayon.css';

/** Props shared by everything drawn in crayon. */
export interface CrayonCommonProps {
  /** Any CSS colour; defaults to the current text colour. Strokes with their own colour keep it. */
  color?: string;
  /** ms to wait before the crayon touches the paper. */
  delay?: number;
  /** false = stay blank and wait (e.g. until scrolled into view). */
  play?: boolean;
  /** Show the finished drawing straight away (skip button, reduced motion). */
  instant?: boolean;
  /** Multiplies the hand's speed, e.g. 2 = draw twice as fast. */
  tempo?: number;
  /** Turn the wax texture filter off (debugging / low-power devices). */
  texture?: boolean;
  onDone?: () => void;
  className?: string;
  style?: CSSProperties;
}

interface CrayonDrawingProps extends CrayonCommonProps {
  plan: CrayonPlan;
  /** Accessible description of what's drawn. */
  label: string;
  /** Seeds the texture so each drawing's grain differs. */
  seed: number;
}

/** Renders a crayon plan and animates it stroke by stroke. */
export function CrayonDrawing({
  plan,
  label,
  seed,
  color = 'currentColor',
  delay = 0,
  play = true,
  instant = false,
  texture = true,
  onDone,
  className,
  style,
}: CrayonDrawingProps) {
  const filterId = `crayon-${useId().replace(/:/g, '')}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // the texture filter works in viewBox units; track how big one unit is on screen
  const [pxPerUnit, setPxPerUnit] = useState(1);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const ro = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      if (width > 0) setPxPerUnit(width / plan.width);
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, [plan.width]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !play) return;

    if (reducedMotion || instant) {
      svg.classList.add('crayon--static');
      onDoneRef.current?.();
      return;
    }
    svg.classList.remove('crayon--static');

    const animations: Animation[] = [];
    svg.querySelectorAll<SVGGElement>('[data-stroke]').forEach((g, i) => {
      const stroke = plan.strokes[i];
      if (!stroke) return;
      g.querySelectorAll('path').forEach((path) => {
        animations.push(
          path.animate(
            [
              { strokeDashoffset: 1, opacity: 1 },
              { strokeDashoffset: 0, opacity: 1 },
            ],
            {
              delay: delay + stroke.delay,
              duration: stroke.duration,
              // slow push-off, quick middle, slight slow-down at the end
              easing: 'cubic-bezier(0.4, 0.05, 0.55, 0.95)',
              fill: 'forwards',
            },
          ),
        );
      });
    });

    let cancelled = false;
    Promise.all(animations.map((a) => a.finished))
      .then(() => !cancelled && onDoneRef.current?.())
      .catch(() => {}); // cancelled on unmount/replay
    return () => {
      cancelled = true;
      animations.forEach((a) => a.cancel());
    };
  }, [plan, play, instant, delay, reducedMotion]);

  return (
    <svg
      ref={svgRef}
      className={['crayon', className].filter(Boolean).join(' ')}
      viewBox={plan.viewBox}
      style={{ ...style, aspectRatio: `${plan.width} / ${plan.height}` }}
      role="img"
      aria-label={label}
    >
      {texture && (
        <defs>
          <CrayonFilter id={filterId} seed={seed % 1000} pxPerUnit={pxPerUnit} strokePx={plan.lineWidth * pxPerUnit} />
        </defs>
      )}
      <g filter={texture ? `url(#${filterId})` : undefined} stroke={color}>
        {plan.strokes.map((stroke, i) => (
          <g key={i} data-stroke="" stroke={stroke.colour}>
            {stroke.passes.map((pass, j) => (
              <path key={j} d={pass.d} pathLength={1} strokeWidth={pass.width} strokeOpacity={pass.opacity} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
