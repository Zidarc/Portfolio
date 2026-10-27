import { useMemo, useState } from 'react';
import { CrayonDrawing, type CrayonCommonProps } from './CrayonDrawing.tsx';
import { planDoodle, type DoodleName } from './doodles.ts';
import { randomSeed } from './random.ts';
import { resolveStyle, type CrayonStyle } from './style.ts';

const LABELS: Record<DoodleName, string> = {
  sparkle: 'Crayon drawing of a sparkly star',
  cat: 'Crayon drawing of a cat',
  flower: 'Crayon drawing of a flower',
  rings: 'Crayon circles',
  smiley: 'Crayon drawing of a smiley face',
};

export interface CrayonDoodleProps extends CrayonCommonProps, Partial<CrayonStyle> {
  name: DoodleName;
  seed?: number;
}

/** A kid's crayon drawing, drawn stroke by stroke. */
export function CrayonDoodle({ name, seed: fixedSeed, messiness, speed, weight, tempo = 1, ...common }: CrayonDoodleProps) {
  const [mountSeed] = useState(randomSeed);
  const seed = fixedSeed ?? mountSeed;

  const plan = useMemo(() => {
    const style = resolveStyle(seed, { messiness, speed, weight });
    return planDoodle(name, { seed, ...style, speed: style.speed * tempo });
  }, [name, seed, messiness, speed, weight, tempo]);

  return <CrayonDrawing plan={plan} seed={seed} label={LABELS[name]} {...common} />;
}
