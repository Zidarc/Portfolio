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
          This whole site is paper, so draw on it. Scribble right over these pages, or open the sketchpad: an
          endless sheet you can wander around and zoom in and out of.
        </p>
        <ul className="sketch__list">
          <li>
            <strong>Draw</strong> with nine crayons in four sizes (chalk on a blackboard at night), and rub out just
            the bits you want.
          </li>
          <li>
            <strong>Type</strong> with "Aa type" when handwriting with a mouse gets old.
          </li>
          <li>
            <strong>Ask me things.</strong> Write or type a question, like "has Ali used Postgres?", press ✨ ask, and
            an AI reads the sheet and writes its answer in crayon right next to your question. It only knows my CV,
            projects and blog, so ask about those.
          </li>
          <li>
            <strong>Keep it:</strong> save the whole sheet as a picture.
          </li>
        </ul>
        <p className="sketch__note">
          Your drawings stay until you close the tab, and nobody else sees them. Only what you ask the AI is sent to
          it; the questions and answers are kept, with nothing about who asked, so I can see what people want to
          know.
        </p>
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
