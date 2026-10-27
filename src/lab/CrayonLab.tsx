import { useMemo, useState } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import type { DoodleName } from '../crayon/doodles.ts';
import { planHandwriting } from '../crayon/handwriting.ts';
import { randomSeed } from '../crayon/random.ts';
import { rollStyle, STYLE_RANGES, type CrayonStyle } from '../crayon/style.ts';
import './CrayonLab.css';

const COLOURS = ['graphite', 'red', 'blue', 'green', 'purple', 'orange'] as const;
const DOODLES: { name: DoodleName; colour: string }[] = [
  { name: 'sparkle', colour: 'var(--crayon-yellow)' },
  { name: 'cat', colour: 'var(--crayon-graphite)' },
  { name: 'flower', colour: 'var(--crayon-green)' },
];
const params = new URLSearchParams(window.location.search);

/** Test bench for tuning the crayon handwriting and doodles. */
export function CrayonLab() {
  const [text, setText] = useState(params.get('text') ?? 'Hello,\nI am Ali Hussain');
  const [colour, setColour] = useState<(typeof COLOURS)[number]>('red');
  const [texture, setTexture] = useState(params.get('texture') !== '0');
  const [seed, setSeed] = useState(() => Number(params.get('seed') ?? randomSeed()));
  /** Slider values the user has pinned; everything else is rolled from the seed. */
  const [pinned, setPinned] = useState<Partial<CrayonStyle>>({});
  const [run, setRun] = useState(0);
  /** 0 = writing text, 1..3 = drawing doodle n, 4 = all done. */
  const [step, setStep] = useState(0);

  const rolled = useMemo(() => rollStyle(seed), [seed]);
  const style = { ...rolled, ...pinned };
  const duration = planHandwriting(text, { seed, ...style, align: 'center' }).totalDuration;

  const restart = () => {
    setStep(0);
    setRun((r) => r + 1);
  };
  const pin = (key: keyof CrayonStyle) => (value: number) => {
    setPinned((p) => ({ ...p, [key]: value }));
    restart();
  };
  const key = `${run}-${seed}-${text}-${style.messiness}-${style.speed}-${style.weight}-${texture}`;

  return (
    <div className="lab">
      <div className="lab__canvas">
        <CrayonText
          key={key}
          text={text}
          seed={seed}
          {...style}
          texture={texture}
          align="center"
          color={`var(--crayon-${colour})`}
          onDone={() => setStep(1)}
          className="lab__text"
        />
        <div className="lab__doodles">
          {DOODLES.map((d, i) => (
            <CrayonDoodle
              key={`${key}-${d.name}`}
              name={d.name}
              seed={seed + i + 1}
              {...pinned}
              texture={texture}
              color={d.colour}
              play={step >= i + 1}
              onDone={() => setStep(i + 2)}
              className="lab__doodle"
            />
          ))}
        </div>
      </div>

      <form className="lab__panel" onSubmit={(e) => e.preventDefault()}>
        <label className="lab__wide">
          Text
          <textarea
            value={text}
            rows={2}
            onChange={(e) => {
              setText(e.target.value);
              setStep(0);
            }}
          />
        </label>

        <Slider label="Messiness" value={style.messiness} random={!('messiness' in pinned)} range={STYLE_RANGES.messiness} min={0} max={2} step={0.05} onChange={pin('messiness')} />
        <Slider label="Speed" value={style.speed} random={!('speed' in pinned)} range={STYLE_RANGES.speed} min={0.25} max={3} step={0.05} onChange={pin('speed')} />
        <Slider label="Crayon thickness" value={style.weight} random={!('weight' in pinned)} range={STYLE_RANGES.weight} min={0.04} max={0.16} step={0.005} onChange={pin('weight')} />

        <fieldset className="lab__colours">
          <legend>Text colour</legend>
          {COLOURS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              aria-pressed={colour === c}
              style={{ background: `var(--crayon-${c})` }}
              onClick={() => setColour(c)}
            />
          ))}
        </fieldset>

        <label className="lab__check">
          <input type="checkbox" checked={texture} onChange={(e) => setTexture(e.target.checked)} />
          Wax texture
        </label>

        <div className="lab__buttons">
          <button type="button" onClick={restart}>
            ↻ Replay
          </button>
          <button
            type="button"
            onClick={() => {
              setSeed(randomSeed());
              setPinned({});
              restart();
            }}
          >
            🎲 New random hand
          </button>
        </div>

        <p className="lab__meta">
          seed {seed} · text {(duration / 1000).toFixed(1)}s ·{' '}
          {step === 0 ? 'writing…' : step <= DOODLES.length ? `drawing ${DOODLES[step - 1]!.name}…` : 'done ✓'}
        </p>
      </form>
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  /** True while the value is still the random roll (not pinned by the user). */
  random: boolean;
  range: [number, number];
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function Slider({ label, value, random, range, min, max, step, onChange }: SliderProps) {
  return (
    <label>
      <span>
        {label} <output>{value.toFixed(step < 0.01 ? 3 : 2)}</output>{' '}
        <small className="lab__hint">{random ? `🎲 random ${range[0]}–${range[1]}` : '📌 pinned'}</small>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
