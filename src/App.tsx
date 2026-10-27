import { Footer } from './components/Footer.tsx';
import { Navbar } from './components/Navbar.tsx';
import { CrayonLab } from './lab/CrayonLab.tsx';
import { About } from './sections/About.tsx';
import { Contact } from './sections/Contact.tsx';
import { Hero } from './sections/Hero.tsx';
import { Placeholder } from './sections/Placeholder.tsx';
import { Skills } from './sections/Skills.tsx';

/** `?lab` opens the crayon test bench; otherwise the site. */
const showLab = new URLSearchParams(window.location.search).has('lab');

export default function App() {
  if (showLab) return <CrayonLab />;
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Placeholder id="projects" title="Projects" stage={5} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
