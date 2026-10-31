import { useEffect, useRef } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { usePrefersReducedMotion } from '../crayon/usePrefersReducedMotion.ts';
import { useMediaQuery } from '../hooks/useMediaQuery.ts';
import './Fish.css';

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));
/** How often the scroll speed is read while scrolling, in ms. */
const SAMPLE_MS = 120;

/**
 * A crayon fish that swims down the page with you. It leads a little in the direction you scroll, tilts
 * nose-first, flaps faster the faster you go, then drifts back and idles when you stop.
 *
 * Kept cheap: one fixed layer moved by transform only (CSS transitions do the gliding), one passive scroll
 * listener, and a few updates a second only while scrolling. The bob and the tail are compositor animations.
 */
export function Fish() {
  const reducedMotion = usePrefersReducedMotion();
  const narrow = useMediaQuery('(max-width: 600px)');
  const ref = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    // on a phone it sits in a corner, so it only moves a little
    const reach = narrow ? 40 : 110;
    const tail = tailRef.current?.getAnimations()[0];

    // While scrolling, the speed is sampled a few times a second and the fish is given a new pose; a CSS
    // transition glides it there on the compositor. Moving it from script every frame made the browser
    // re-check the whole page's layers 60 times a second.
    let timer = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let lastScroll = 0;
    let rate = 1;

    const pose = (speed: number) => {
      const lead = clamp(speed * 0.06, reach);
      // on a phone it sits in the bottom corner, so it rises whichever way you scroll instead of sinking off screen
      const y = narrow ? -Math.abs(lead) : lead;
      // it faces left, so nose-down is anticlockwise
      const tilt = clamp(-speed * 0.025, 32);
      el.style.transform = `translate3d(0, ${y.toFixed(0)}px, 0) rotate(${tilt.toFixed(0)}deg)`;
      const wanted = 1 + Math.min(3, Math.round(Math.abs(speed) / 350) / 2);
      if (tail && wanted !== rate) tail.playbackRate = rate = wanted;
    };

    const sample = () => {
      const now = performance.now();
      const sy = window.scrollY;
      const speed = ((sy - lastY) / Math.max(1, now - lastT)) * 1000;
      lastY = sy;
      lastT = now;
      if (now - lastScroll > SAMPLE_MS * 2) {
        // stopped: drift back and idle
        el.classList.add('fish--resting');
        pose(0);
        timer = 0;
        return;
      }
      el.classList.remove('fish--resting');
      pose(speed);
      timer = window.setTimeout(sample, SAMPLE_MS);
    };

    const onScroll = () => {
      lastScroll = performance.now();
      if (!timer) {
        lastY = window.scrollY;
        lastT = lastScroll;
        timer = window.setTimeout(sample, SAMPLE_MS);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [reducedMotion, narrow]);

  if (reducedMotion) return null;

  return (
    <div className="fish" ref={ref} aria-hidden="true">
      <div className="fish__swim">
        <div className="fish__tail" ref={tailRef}>
          <CrayonDoodle name="swimmerTail" instant decorative color="var(--crayon-orange)" />
        </div>
        <CrayonDoodle name="swimmer" instant decorative color="var(--crayon-orange)" />
      </div>
    </div>
  );
}
