import { memo, useMemo, useState } from 'react';
import { CrayonDrawing, type CrayonCommonProps } from './CrayonDrawing.tsx';
import { planDoodle, type DoodleName } from './doodles.ts';
import { randomSeed } from './random.ts';
import { resolveStyle, type CrayonStyle } from './style.ts';

const LABELS: Record<DoodleName, string> = {
  sparkle: 'Crayon drawing of two sparkly stars',
  cat: 'Crayon drawing of a cat',
  flower: 'Crayon drawing of a flower',
  rings: 'Crayon circles',
  smiley: 'Crayon drawing of a smiley face',
  arrow: 'Crayon arrow',
  menu: 'Menu',
  cross: 'Close',
  underline: 'Crayon line',
  check: 'Tick',
  dot: 'Crayon dot',
  heart: 'Crayon heart',
  sun: 'Crayon sun',
  cloud: 'Crayon cloud',
  fish: 'Crayon fish',
  swimmer: 'Crayon fish',
  swimmerTail: 'Crayon fish tail',
  plane: 'Crayon paper plane',
  bolt: 'Crayon lightning bolt',
  spiral: 'Crayon spiral',
  rocket: 'Crayon rocket',
  note: 'Crayon music notes',
  rainbow: 'Crayon rainbow',
  moon: 'Crayon moon',
  bulb: 'Crayon light bulb',
  crown: 'Crayon crown',
};

export interface CrayonDoodleProps extends CrayonCommonProps, Partial<CrayonStyle> {
  name: DoodleName;
  seed?: number;
}

/** A kid's crayon drawing, drawn stroke by stroke. */
// memo: a parent re-rendering (say, a box waking up) shouldn't re-render a finished drawing
export const CrayonDoodle = memo(function CrayonDoodle({
  name,
  seed: fixedSeed,
  messiness,
  speed,
  weight,
  tempo = 1,
  ...common
}: CrayonDoodleProps) {
  const [mountSeed] = useState(randomSeed);
  const seed = fixedSeed ?? mountSeed;

  const plan = useMemo(() => {
    const style = resolveStyle(seed, { messiness, speed, weight });
    return planDoodle(name, { seed, ...style, speed: style.speed * tempo });
  }, [name, seed, messiness, speed, weight, tempo]);

  return <CrayonDrawing plan={plan} seed={seed} label={LABELS[name]} {...common} />;
});
