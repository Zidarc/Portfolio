import { Navbar } from './components/Navbar.tsx';
import { CrayonLab } from './lab/CrayonLab.tsx';
import { Hero } from './sections/Hero.tsx';
import { Placeholder } from './sections/Placeholder.tsx';

/** `?lab` opens the crayon test bench; otherwise the site. */
const showLab = new URLSearchParams(window.location.search).has('lab');

export default function App() {
  if (showLab) return <CrayonLab />;
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Placeholder id="about" title="About" stage={4} />
        <Placeholder id="skills" title="Skills" stage={4} />
        <Placeholder id="projects" title="Projects" stage={5} />
        <Placeholder id="contact" title="Contact" stage={4} />
      </main>
    </>
  );
}
