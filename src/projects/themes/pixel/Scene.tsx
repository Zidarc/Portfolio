import type { ThemeSceneProps } from '../../theme.ts';
import { at } from '../../sketch.ts';
import { CLOUD, COIN, HERO_A, HERO_B, PRESS_START, Rects, TENS, TOWN, type Rect } from './art.tsx';
import './pixel.css';

/** A pixel layer: `cols` x `rows` grid pixels, each 4 sheet units. */
const pixels = (rects: Rect[], cols: number, rows: number) => (
  <svg viewBox={`0 0 ${cols} ${rows}`} preserveAspectRatio="none" focusable="false">
    <Rects rects={rects} />
  </svg>
);

const ART = (
  <svg className="px-art" viewBox="0 0 80 50" preserveAspectRatio="none" focusable="false">
    <Rects rects={TOWN} />
  </svg>
);
const CLOUD_ART = pixels(CLOUD, 10, 4);
const COIN_ART = pixels(COIN, 5, 5);
const HERO_A_ART = pixels(HERO_A, 8, 9);
const HERO_B_ART = pixels(HERO_B, 8, 9);
const TENS_ART = pixels(TENS, 2, 12);
const START_ART = pixels(PRESS_START, 22, 3);

/** Coins hang over the road; the hero is under each one at 28.3%, 50% and 71.7% of its walk. */
const COIN_X = [78, 158, 238];

/**
 * Pixel Town: a little town from a pixel game. Idle, it's a title screen (hero waiting on the road,
 * coins hanging, PRESS START). Active, the hero walks the road in pixel steps, hops for each coin and
 * the score ticks up while the clouds drift. All of it is stepped CSS transform/opacity; no JS clock.
 */
export default function Scene({ active, visible, reducedMotion }: ThemeSceneProps) {
  const live = active && visible && !reducedMotion;

  return (
    <div className={`px-scene${live ? ' px-live' : ''}`}>
      {ART}
      <div className="px-at px-cloud px-cloud--1" style={at(32, 40, 40, 16)}>
        {CLOUD_ART}
      </div>
      <div className="px-at px-cloud px-cloud--2" style={at(220, 52, 40, 16)}>
        {CLOUD_ART}
      </div>
      {COIN_X.map((x, i) => (
        <div key={x} className={`px-at px-coin px-coin--${i + 1}`} style={at(x, 96, 20, 20)}>
          <div className="px-coin__bob">{COIN_ART}</div>
        </div>
      ))}
      <div className="px-at px-hero" style={at(0, 128, 32, 36)}>
        <div className="px-hero__hop">
          <div className="px-hero__frame px-hero__frame--a">{HERO_A_ART}</div>
          <div className="px-hero__frame px-hero__frame--b">{HERO_B_ART}</div>
        </div>
      </div>
      <div className="px-at px-tens" style={at(88, 8, 8, 12)}>
        <div className="px-tens__strip">{TENS_ART}</div>
      </div>
      <div className="px-at px-start" style={at(117, 180, 88, 12)}>
        {START_ART}
      </div>
    </div>
  );
}
