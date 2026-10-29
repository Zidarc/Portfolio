import type { CSSProperties } from 'react';
import { CrayonShape } from '../crayon/CrayonShape.tsx';
import { MarginDoodles } from '../components/MarginDoodles.tsx';
import { SectionHeading } from '../components/SectionHeading.tsx';
import { skillGroups } from '../data/skills.ts';
import './Skills.css';

export function Skills() {
  return (
    <section id="skills" className="section skills" aria-labelledby="skills-heading">
      <MarginDoodles set="skills" />
      <SectionHeading id="skills-heading" text="Skills" color="var(--crayon-green)" />
      <p className="skills__intro">Everything I've used to ship the projects below, sorted into crayon boxes.</p>

      <ul className="skills__grid">
        {skillGroups.map((group) => {
          const colour = `var(--crayon-${group.colour})`;
          const style = { '--card-colour': colour, '--card-ink': `var(--ink-${group.colour})` } as CSSProperties;
          return (
            <li key={group.title} className="skill-card" style={style}>
              {/* already drawn: a grid of boxes drawing in at once was work for little */}
              <CrayonShape shape="box" instant color={colour} />
              <h3 className="skill-card__title">{group.title}</h3>
              <ul className="skill-card__chips">
                {group.skills.map((skill) => (
                  <li key={skill} className="chip">
                    {skill}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
