interface CrayonFilterProps {
  id: string;
  seed?: number;
  /** Rendered screen pixels per viewBox unit, so paper grain stays the same size whatever the text size. */
  pxPerUnit?: number;
  /** Rendered width of the main crayon line in px; thin lines get gentler roughening and fewer specks. */
  strokePx?: number;
}

/**
 * Wax-on-paper texture, applied to a whole group of strokes:
 *  1. displacement roughens the stroke edges
 *  2. fine noise punches specks where the paper's tooth stops the wax
 *  3. broad noise varies how hard the crayon was pressed
 * Filter units are viewBox units, so every size below is converted from screen pixels.
 */
export function CrayonFilter({ id, seed = 1, pxPerUnit = 1, strokePx = 10 }: CrayonFilterProps) {
  const freq = (featurePx: number) => (pxPerUnit / featurePx).toFixed(4);
  const px = (n: number) => n / pxPerUnit;
  // 0 for hairlines, 1 from ~10px wide: how much texture the line can take before it falls apart
  const body = Math.min(1, Math.max(0.3, (strokePx - 2) / 8));
  const toothOffset = (-1.95 + (1 - body) * 1.1).toFixed(2);

  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
      {/* coarse wobble of the outline, then fine chipping along it */}
      <feTurbulence type="fractalNoise" baseFrequency={freq(9)} numOctaves={1} seed={seed} result="wobbleNoise" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="wobbleNoise"
        scale={px(3.5 * body)}
        xChannelSelector="R"
        yChannelSelector="G"
        result="wobbled"
      />
      <feTurbulence type="fractalNoise" baseFrequency={freq(1.8)} numOctaves={2} seed={seed + 3} result="chipNoise" />
      <feDisplacementMap
        in="wobbled"
        in2="chipNoise"
        scale={px(4 * body)}
        xChannelSelector="R"
        yChannelSelector="G"
        result="ragged"
      />

      <feTurbulence type="fractalNoise" baseFrequency={freq(1.4)} numOctaves={2} seed={seed + 7} result="grain" />
      <feColorMatrix in="grain" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 6 ${toothOffset}`} result="tooth" />

      <feTurbulence type="fractalNoise" baseFrequency={freq(40)} numOctaves={1} seed={seed + 13} result="pressureNoise" />
      <feColorMatrix
        in="pressureNoise"
        type="matrix"
        values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0.5"
        result="pressure"
      />

      <feComposite in="ragged" in2="tooth" operator="in" result="specked" />
      <feComposite in="specked" in2="pressure" operator="in" />
    </filter>
  );
}
