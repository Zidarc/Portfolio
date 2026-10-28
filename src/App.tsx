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

export default function App() {
  if (params.has('lab')) return <CrayonLab />;
  if (params.has('projects')) return <ProjectLab />;
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Hats />
        <Skills />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
