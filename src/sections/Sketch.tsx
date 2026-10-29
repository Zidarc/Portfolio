import { useRef, type CSSProperties } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonShape } from '../crayon/CrayonShape.tsx';
import { MarginDoodles } from '../components/MarginDoodles.tsx';
import { SectionHeading } from '../components/SectionHeading.tsx';
import { useInView } from '../hooks/useInView.ts';
import { CRAYONS } from '../scribble/brush.ts';
import { START_SCRIBBLE } from '../scribble/PageScribble.tsx';
import './Sketch.css';

/** "Grab a crayon": tells visitors they can draw, on this page or on the /draw sketchpad. */
export function Sketch() {
  const boxRef = useRef<HTMLDivElement>(null);
  const inView = useInView(boxRef);

  return (
    <section id="draw" className="section sketch" aria-labelledby="draw-heading">
      <MarginDoodles set="draw" />
      <div className="sketch__words">
        <SectionHeading id="draw-heading" text="Grab a crayon" color="var(--crayon-red)" />
        <p>
          This whole site is paper, so draw on it. Scribble right over these pages, or take a blank sheet on the
          sketchpad: nine crayons, four sizes and an eraser that rubs out just the bits you want.
        </p>
        <p className="sketch__note">Your drawings stay until you close the tab. Nobody else sees them.</p>
        <div className="sketch__actions">
          <button
            type="button"
            className="sketch__button"
            onClick={() => window.dispatchEvent(new Event(START_SCRIBBLE))}
          >
            🖍 scribble on this page
          </button>
          <a className="sketch__button sketch__button--ghost" href="/draw">
            open the sketchpad →
          </a>
        </div>
      </div>

      <div ref={boxRef} className="sketch__box" aria-hidden="true">
        <CrayonShape shape="box" play={inView} tempo={1.4} color="var(--crayon-graphite)" />
        <div className="sketch__crayons">
          {CRAYONS.map((c, i) => (
            <span key={c.name} className="sketch__crayon" style={{ '--c': c.value, '--i': i } as CSSProperties} />
          ))}
        </div>
        <div className="sketch__doodle">
          <CrayonDoodle name="flower" decorative play={inView} delay={600} tempo={1.8} />
        </div>
      </div>
    </section>
  );
}
