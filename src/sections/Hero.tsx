import { useEffect, useState } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { usePrefersReducedMotion } from '../crayon/usePrefersReducedMotion.ts';
import { GITHUB_URL, RESUME_URL } from '../data/links.ts';
import { hunaLine, useHunaMood } from '../hooks/useHunaMood.ts';
import { startWarmup } from '../projects/warmup.ts';
import './Hero.css';

/**
 * The intro plays in this order; each step starts when the previous one finishes.
 * The photo doesn't wait its turn: it's there from the start, and the rings are drawn around it last.
 */
const TEXT = 0;
const SPARKLE = 1;
const CAT = 2;
const FLOWER = 3;
const RINGS = 4;
const DONE = 5;

/** Background-removed cutout made by scripts/make-portrait.py. */
const PHOTO_SRC = `${import.meta.env.BASE_URL}ali.webp`;

/** The intro plays once per visit; reloading after that shows the finished drawing. */
const INTRO_SEEN_KEY = 'hero-intro-seen';

const introSeen = () => {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false; // storage blocked: just play it
  }
};

const rememberIntro = () => {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // storage blocked: it plays again next time, which is fine
  }
};

export function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState(TEXT);
  const [skipped, setSkipped] = useState(introSeen);
  const [photoOk, setPhotoOk] = useState(true);
  const huna = useHunaMood();

  const instant = skipped || reducedMotion;
  const shown = instant ? DONE : phase;
  const advanceTo = (step: number) => () => setPhase((p) => Math.max(p, step));

  // the landing drawing is done: get the project boxes ready while the visitor reads
  useEffect(() => {
    if (shown !== DONE) return;
    rememberIntro();
    startWarmup();
  }, [shown]);

  const replay = () => {
    setSkipped(false);
    setPhase(TEXT);
    setRun((r) => r + 1);
  };

  const common = { instant, texture: true };
  const named = shown >= SPARKLE;

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
          <p className={`hero__tagline ${named ? 'is-visible' : ''}`}>
            CS '29 at FAST NUCES, Karachi. Backend &amp; systems: I build things that don't fall over.
          </p>
          <a
            href={RESUME_URL}
            target="_blank"
            rel="noreferrer"
            className={`hero__resume ${named ? 'is-visible' : ''}`}
            tabIndex={named ? undefined : -1}
          >
            my résumé ↗
          </a>
        </div>

        <div className="hero__portrait">
          <div className="hero__frame">
            <div className="hero__photo">
              {photoOk ? (
                <img src={PHOTO_SRC} alt="Ali Hussain" onError={() => setPhotoOk(false)} />
              ) : (
                <CrayonDoodle {...common} name="smiley" color="var(--crayon-graphite)" tempo={2} />
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
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hero__cat" title="Feed Huna on GitHub">
            <span className="sr-only">Huna the cat: feed her on my GitHub</span>
            <CrayonDoodle
              {...common}
              name="cat"
              decorative
              color="var(--crayon-graphite)"
              tempo={2.4}
              play={shown >= CAT}
              onDone={advanceTo(FLOWER)}
            />
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className={`hero__huna ${shown >= DONE ? 'is-visible' : ''}`}
            tabIndex={shown >= DONE ? undefined : -1}
          >
            <span aria-hidden="true">↖ </span>psst, that's Huna. {hunaLine(huna)}
          </a>
          <CrayonDoodle
            {...common}
            name="flower"
            tempo={2.2}
            play={shown >= FLOWER}
            onDone={advanceTo(RINGS)}
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
