import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { useMediaQuery } from '../hooks/useMediaQuery.ts';
import './NotFound.css';

/** The page Netlify (and the Docker server) show for any address that isn't on the site. */
export function NotFound() {
  const narrow = useMediaQuery('(max-width: 600px)');

  return (
    <main className="nf">
      <h1 className="nf__code">
        <span className="sr-only">404: page not found</span>
        <CrayonText
          text="404"
          decorative
          capHeight={narrow ? 90 : 130}
          tempo={1.2}
          delay={300}
          color="var(--crayon-red)"
        />
      </h1>
      <p className="nf__line">Huna looked everywhere, but this page got erased.</p>
      <div className="nf__cat" aria-hidden="true">
        <CrayonDoodle name="cat" decorative tempo={2.4} delay={1500} color="var(--crayon-graphite)" />
      </div>
      <a className="nf__home" href="/">
        ↩ back to the homepage
      </a>
    </main>
  );
}
