import { useRef } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonShape } from '../crayon/CrayonShape.tsx';
import { SectionHeading } from '../components/SectionHeading.tsx';
import { useInView } from '../hooks/useInView.ts';
import './About.css';

const SCHOOLS = [
  { name: 'BVS Parsi High School', years: '2013 – 2022', url: 'https://www.bvsparsischool.edu.pk/', colour: 'orange' },
  { name: 'Cedar College', years: '2022 – 2024', url: 'https://college.cedar.edu.pk/pechs/', colour: 'green' },
  {
    name: 'FAST NUCES, Karachi',
    years: '2025 – now',
    detail: 'BS Computer Science',
    url: 'https://www.nu.edu.pk/',
    colour: 'red',
  },
];

export function About() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInView = useInView(timelineRef);

  return (
    <section id="about" className="section about" aria-labelledby="about-heading">
      <div className="about__story">
        <SectionHeading id="about-heading" text="About me" color="var(--crayon-blue)" />
        <p>
          I'm Ali Hussain, a Computer Science student at FAST NUCES in Karachi (class of '29). I'm a backend and
          systems person: I like building things that don't fall over, like failover setups, real-time systems and
          infrastructure that holds up under actual load. Most days that's TypeScript, Python and C++, with Node,
          Postgres, MongoDB and Supabase behind React or Next.js.
        </p>
        <p>
          So far that's meant live trading platforms that held 100+ traders at once for the Synergy and Negotium
          competitions, a real-time team puzzle game for DevDay '26, the registration portal for The Grand Debate '26
          and the GitHub Campus Club website. Right now I'm fine-tuning vision models for <em>Ishara</em>, which helps
          visually impaired students get around campus.
        </p>
      </div>

      <div className="about__school">
        <SectionHeading text="School days" color="var(--crayon-orange)" small />
        <div ref={timelineRef} className="timeline">
          <div className="timeline__rail">
            <CrayonShape shape="vline" lineWidth={3} play={timelineInView} tempo={0.8} color="var(--crayon-graphite)" />
          </div>
          <ol className="timeline__list">
            {SCHOOLS.map((s, i) => (
              <li key={s.name} className="timeline__stop">
                <span className="timeline__dot" aria-hidden="true">
                  <CrayonDoodle
                    name="dot"
                    decorative
                    play={timelineInView}
                    delay={500 + i * 450}
                    tempo={2}
                    weight={0.09}
                    color={`var(--crayon-${s.colour})`}
                  />
                </span>
                <span className="timeline__years">{s.years}</span>
                <a href={s.url} target="_blank" rel="noreferrer" className="timeline__name">
                  {s.name}
                </a>
                {s.detail && <span className="timeline__detail">{s.detail}</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
