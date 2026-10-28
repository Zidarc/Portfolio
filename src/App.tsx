import { lazy, startTransition, Suspense, useEffect, useState } from 'react';
import { Footer } from './components/Footer.tsx';
import { Navbar } from './components/Navbar.tsx';
import { CrayonLab } from './lab/CrayonLab.tsx';
import { ProjectLab } from './lab/ProjectLab.tsx';
import { About } from './sections/About.tsx';
import { Contact } from './sections/Contact.tsx';
import { Hats } from './sections/Hats.tsx';
import { Hero } from './sections/Hero.tsx';
import { Projects } from './sections/Projects.tsx';
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

function Site() {
  // The hero fills the first screen, so everything under it is rendered just after the first paint, as a
  // background update React can split into small slices. On a slow phone that's the difference between a
  // second-long freeze at load and none. A link to a section (#projects) needs it all there to scroll to.
  const [below, setBelow] = useState(() => window.location.hash.length > 1);

  useEffect(() => {
    if (!below) startTransition(() => setBelow(true));
  }, [below]);

  return (
    <>
      <Navbar sectionsReady={below} />
      <main>
        <Hero />
        {below && (
          <>
            <About />
            <Hats />
            <Skills />
            <Projects />
            <Contact />
          </>
        )}
      </main>
      {below && <Footer />}
    </>
  );
}
