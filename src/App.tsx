import { projects } from './data/projects.ts';
import './App.css';

/** Stage 0 placeholder: blank paper with a quick sanity check of fonts, colours and data. */
export default function App() {
  return (
    <main className="stage0">
      <p className="stage0__note">Stage 0: blank paper ✏️</p>
      <ul className="stage0__swatches" aria-label="Crayon colours">
        {['graphite', 'red', 'blue', 'green', 'yellow', 'orange', 'purple'].map((c) => (
          <li key={c} style={{ background: `var(--crayon-${c})` }} title={c} />
        ))}
      </ul>
      <p className="stage0__note">{projects.length} projects loaded</p>
    </main>
  );
}
