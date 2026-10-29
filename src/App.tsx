import { lazy, startTransition, Suspense, useEffect, useState } from 'react';
import { CrayonCursor } from './components/CrayonCursor.tsx';
import { Footer } from './components/Footer.tsx';
import { Navbar } from './components/Navbar.tsx';
import { SoundToggle } from './components/SoundToggle.tsx';
import { PageScribble } from './scribble/PageScribble.tsx';
import { CrayonLab } from './lab/CrayonLab.tsx';
import { ProjectLab } from './lab/ProjectLab.tsx';
import { About } from './sections/About.tsx';
import { Contact } from './sections/Contact.tsx';
import { Hats } from './sections/Hats.tsx';
import { Hero } from './sections/Hero.tsx';
import { Projects } from './sections/Projects.tsx';
import { Sketch } from './sections/Sketch.tsx';
import { Skills } from './sections/Skills.tsx';

/** `?lab` opens the crayon test bench, `?projects` the project box bench; otherwise the site. */
const params = new URLSearchParams(window.location.search);

/** Dev only: `?og` draws the link-preview card that's saved as public/og.jpg. Left out of production builds. */
const OgCard = import.meta.env.DEV ? lazy(() => import('./lab/OgCard.tsx')) : null;

export default function App() {
  if (params.has('lab')) return <CrayonLab />;
  if (params.has('projects')) return <ProjectLab />;
  if (OgCard && params.has('og')) {
    return (
      <Suspense fallback={null}>
        <OgCard />
      </Suspense>
    );
  }
  return <Site />;
}

/** Everything under the hero, in page order. */
const BELOW = [About, Hats, Skills, Projects, Sketch, Contact];

// Safari has no requestIdleCallback
const idle = (fn: () => void) =>
  typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50);

function Site() {
  // The hero fills the first screen, so the sections under it are added after the first paint, one per
  // idle moment, each as a background update React can slice up. Adding them all in one go was a long
  // freeze on a slow phone; one at a time, no single step is big. A link to a section (#projects) needs
  // everything there at once to scroll to.
  const [shown, setShown] = useState(() => (window.location.hash.length > 1 ? BELOW.length : 0));
  const all = shown >= BELOW.length;

  useEffect(() => {
    if (all) return;
    const id = idle(() => startTransition(() => setShown((n) => n + 1)));
    return () => (typeof cancelIdleCallback === 'function' ? cancelIdleCallback(id) : clearTimeout(id));
  }, [shown, all]);

  return (
    <>
      <Navbar sectionsReady={all} />
      <main>
        <Hero />
        {BELOW.slice(0, shown).map((Section, i) => (
          <Section key={i} />
        ))}
      </main>
      {all && <Footer />}
      <SoundToggle />
      {all && <PageScribble />}
      <CrayonCursor />
    </>
  );
}
