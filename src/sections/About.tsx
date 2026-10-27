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
          I'm Ali Hussain, a Computer Science student at FAST National University in Karachi. I like building
          things people actually use, from real-time web apps to computer-vision prototypes.
        </p>
        <p>
          So far that's meant crypto and stock-trading simulators that held up under 100+ live traders, a real-time
          puzzle game for DevDay '26, <em>Ishara</em> (AR wayfinding for visually impaired students), a registration
          portal for a Model UN and the GitHub Campus Club website. Along the way: hackathons like NASA Space Apps
          and Trustworthy AI × GES UCLA.
        </p>
        <p>
          Most days I'm in TypeScript, Python and C++: React and Next.js up front; Node, Express, MongoDB and Supabase
          behind it; YOLO and OpenVINO when there's a camera involved; Power BI when the data needs a picture. In
          between, I grind Codeforces problems for ICPC.
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
