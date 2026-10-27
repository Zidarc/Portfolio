import { useEffect, useMemo, useRef, useState } from 'react';
import { CrayonDrawing, type CrayonCommonProps } from './CrayonDrawing.tsx';
import { randomSeed } from './random.ts';
import { planShape, shapePad, type ShapeName } from './shapes.ts';
import { resolveStyle, type CrayonStyle } from './style.ts';

export interface CrayonShapeProps extends CrayonCommonProps, Partial<Omit<CrayonStyle, 'weight'>> {
  shape: ShapeName;
  /** Crayon line width in px. */
  lineWidth?: number;
  seed?: number;
}

/**
 * Draws a crayon shape (box, line…) sized to its parent element.
 * The parent must be `position: relative`; the drawing overlays it and ignores the pointer.
 */
export function CrayonShape({
  shape,
  lineWidth = 3.5,
  seed: fixedSeed,
  messiness,
  speed,
  tempo = 1,
  onDone,
  instant,
  ...common
}: CrayonShapeProps) {
  const [mountSeed] = useState(randomSeed);
  const seed = fixedSeed ?? mountSeed;
  const weight = lineWidth / 100;
  const pad = shapePad(weight);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const drawnRef = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const w = Math.round(entry.contentRect.width - pad * 2);
      const h = Math.round(entry.contentRect.height - pad * 2);
      if (w <= 0 || h <= 0) return;
      // ignore sub-pixel jitter so the drawing doesn't re-plan constantly
      setSize((s) => (s && Math.abs(s.w - w) < 3 && Math.abs(s.h - h) < 3 ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [pad]);

  const plan = useMemo(() => {
    if (!size) return null;
    const style = resolveStyle(seed, { messiness, speed, weight });
    return planShape(shape, size.w, size.h, { seed, ...style, speed: style.speed * tempo });
  }, [shape, size, seed, messiness, speed, weight, tempo]);

  return (
    <div ref={wrapRef} className="crayon-shape" style={{ inset: -pad }} aria-hidden="true">
      {plan && (
        <CrayonDrawing
          plan={plan}
          seed={seed}
          label=""
          decorative
          // once drawn, a resize just re-plans and shows the new outline straight away
          instant={instant || drawnRef.current}
          onDone={() => {
            drawnRef.current = true;
            onDone?.();
          }}
          {...common}
        />
      )}
    </div>
  );
}
