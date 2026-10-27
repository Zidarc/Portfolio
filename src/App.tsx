import { CrayonLab } from './lab/CrayonLab.tsx';
import { Hero } from './sections/Hero.tsx';

/** `?lab` opens the crayon test bench; otherwise the site. */
const showLab = new URLSearchParams(window.location.search).has('lab');

export default function App() {
  if (showLab) return <CrayonLab />;
  return (
    <main>
      <Hero />
    </main>
  );
}
