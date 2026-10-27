import { useEffect, useState } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { usePrefersReducedMotion } from '../crayon/usePrefersReducedMotion.ts';
import './Hero.css';

/** The intro plays in this order; each step starts when the previous one finishes. */
const TEXT = 0;
const SPARKLE = 1;
const CAT = 2;
const FLOWER = 3;
const PHOTO = 4;
const RINGS = 5;
const DONE = 6;

/** How long the photo takes to settle before the circles start. Matches the CSS transition. */
const PHOTO_SETTLE_MS = 650;

const PHOTO_SRC = `${import.meta.env.BASE_URL}ali.jpg`;

export function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState(TEXT);
  const [skipped, setSkipped] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);

  const instant = skipped || reducedMotion;
  const shown = instant ? DONE : phase;
  const advanceTo = (step: number) => () => setPhase((p) => Math.max(p, step));

  useEffect(() => {
    if (shown !== PHOTO) return;
    const t = setTimeout(() => setPhase(RINGS), PHOTO_SETTLE_MS);
    return () => clearTimeout(t);
  }, [shown]);

  const replay = () => {
    setSkipped(false);
    setPhase(TEXT);
    setRun((r) => r + 1);
  };

  const common = { instant, texture: true };

  return (
    <section className="hero" id="home" aria-label="Introduction" key={run}>
      <div className="hero__inner">
        <div className="hero__words">
          <h1 className="hero__title">
            <CrayonText
              {...common}
              text={'Hello,\nI am Ali Hussain'}
              color="var(--crayon-red)"
              tempo={1.2}
              delay={400}
              onDone={advanceTo(SPARKLE)}
            />
          </h1>
          <CrayonDoodle
            {...common}
            name="sparkle"
            color="var(--crayon-yellow)"
            tempo={1.6}
            play={shown >= SPARKLE}
            onDone={advanceTo(CAT)}
            className="hero__sparkle"
          />
          <p className={`hero__tagline ${shown >= PHOTO ? 'is-visible' : ''}`}>
            Computer Science student at FAST NUCES, Karachi. I build web apps, real-time games and
            data-heavy things.
          </p>
        </div>

        <div className="hero__portrait">
          <div className="hero__frame">
            <div className={`hero__photo ${shown >= PHOTO ? 'is-visible' : ''}`}>
              {photoOk ? (
                <img src={PHOTO_SRC} alt="Ali Hussain" onError={() => setPhotoOk(false)} />
              ) : (
                <CrayonDoodle {...common} name="smiley" color="var(--crayon-graphite)" tempo={2} play={shown >= PHOTO} />
              )}
            </div>
            <CrayonDoodle
              {...common}
              name="rings"
              tempo={1.5}
              play={shown >= RINGS}
              onDone={advanceTo(DONE)}
              className="hero__rings"
            />
          </div>
          <CrayonDoodle
            {...common}
            name="cat"
            color="var(--crayon-graphite)"
            tempo={2.4}
            play={shown >= CAT}
            onDone={advanceTo(FLOWER)}
            className="hero__cat"
          />
          <CrayonDoodle
            {...common}
            name="flower"
            tempo={2.2}
            play={shown >= FLOWER}
            onDone={advanceTo(PHOTO)}
            className="hero__flower"
          />
        </div>
      </div>

      {shown < DONE ? (
        <button type="button" className="hero__control" onClick={() => setSkipped(true)}>
          skip ⏭
        </button>
      ) : (
        !reducedMotion && (
          <button type="button" className="hero__control" onClick={replay}>
            ↻ draw it again
          </button>
        )
      )}
    </section>
  );
}
