import { useMemo, useState } from 'react';
import { CrayonDrawing, type CrayonCommonProps } from './CrayonDrawing.tsx';
import { planHandwriting, type HandwritingOptions } from './handwriting.ts';
import { randomSeed } from './random.ts';
import { resolveStyle } from './style.ts';

export interface CrayonTextProps extends CrayonCommonProps, Partial<Omit<HandwritingOptions, 'seed'>> {
  text: string;
  /** Fixed seed for repeatable handwriting. Omit for a fresh hand on every mount. */
  seed?: number;
  /**
   * Size by letter height (px of a capital) instead of filling the container's width,
   * so words with descenders or different lengths still match each other.
   */
  capHeight?: number;
}

/**
 * Writes `text` letter by letter, stroke by stroke, like a kid with a crayon. Use `\n` for line breaks.
 * Messiness, speed and weight are picked from STYLE_RANGES unless given.
 */
export function CrayonText({
  text,
  seed: fixedSeed,
  messiness,
  speed,
  weight,
  align,
  lineHeight,
  letterSpacing,
  wordSpacing,
  tempo = 1,
  capHeight,
  style,
  ...common
}: CrayonTextProps) {
  const [mountSeed] = useState(randomSeed);
  const seed = fixedSeed ?? mountSeed;

  const plan = useMemo(() => {
    const style = resolveStyle(seed, { messiness, speed, weight });
    return planHandwriting(text, {
      seed,
      ...style,
      speed: style.speed * tempo,
      align,
      lineHeight,
      letterSpacing,
      wordSpacing,
    });
  }, [text, seed, messiness, speed, weight, tempo, align, lineHeight, letterSpacing, wordSpacing]);

  // viewBox units are 1/100 of a capital letter
  const sized = capHeight ? { width: `${(plan.width * capHeight) / 100}px`, height: 'auto', ...style } : style;

  return <CrayonDrawing plan={plan} seed={seed} label={text.replace(/\n/g, ' ')} style={sized} {...common} />;
}
