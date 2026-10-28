import { useRef, type CSSProperties } from 'react';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonShape } from '../crayon/CrayonShape.tsx';
import { SectionHeading } from '../components/SectionHeading.tsx';
import { roles, type Role } from '../data/roles.ts';
import { useInView } from '../hooks/useInView.ts';
import './Hats.css';

const current = roles.filter((r) => !r.end);
const earlier = roles.filter((r) => r.end);

function RoleCards({ list, play }: { list: Role[]; play: boolean }) {
  return list.map((role, i) => {
    const colour = `var(--crayon-${role.colour})`;
    const style = { '--card-colour': colour, '--card-ink': `var(--ink-${role.colour})` } as CSSProperties;
    return (
      <li key={role.title + role.org} className="hat-card" style={style}>
        <CrayonShape shape="box" play={play} delay={i * 200} tempo={1.6} color={colour} />
        <span className="hat-card__dates">
          {role.start} – {role.end ?? <span className="hat-card__now">now</span>}
        </span>
        <h4 className="hat-card__title">{role.title}</h4>
        <span className="hat-card__org">{role.org}</span>
        {role.skills.length > 0 && (
          <ul className="hat-card__chips">
            {role.skills.map((skill) => (
              <li key={skill} className="chip">
                {skill}
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  });
}

export function Hats() {
  const nowRef = useRef<HTMLUListElement>(null);
  const beforeRef = useRef<HTMLUListElement>(null);
  const icpcRef = useRef<HTMLDivElement>(null);
  const nowInView = useInView(nowRef);
  const beforeInView = useInView(beforeRef);
  const icpcInView = useInView(icpcRef);

  return (
    <section id="roles" className="section hats" aria-labelledby="roles-heading">
      <SectionHeading id="roles-heading" text="Hats I wear" color="var(--crayon-red)" />
      <p className="hats__intro">The societies and teams I'm part of.</p>

      <div ref={icpcRef} className="hats__icpc">
        <span className="hats__icpc-star" aria-hidden="true">
          <CrayonDoodle name="sparkle" decorative play={icpcInView} tempo={1.8} color="var(--crayon-yellow)" />
        </span>
        <p>
          <strong>ICPC 2026:</strong> ranked 47th and qualified for the regional onsite round.
        </p>
      </div>

      <h3 className="hats__group">Right now</h3>
      <ul ref={nowRef} className="hats__grid">
        <RoleCards list={current} play={nowInView} />
      </ul>

      <h3 className="hats__group">Before that</h3>
      <ul ref={beforeRef} className="hats__grid">
        <RoleCards list={earlier} play={beforeInView} />
      </ul>
    </section>
  );
}
