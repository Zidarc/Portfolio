import { useEffect } from 'react';
import { MarginDoodles } from '../components/MarginDoodles.tsx';
import { SectionHeading } from '../components/SectionHeading.tsx';
import { projects } from '../data/projects.ts';
import { ProjectCard } from '../projects/ProjectCard.tsx';
import { startWarmup } from '../projects/warmup.ts';

/** If the visitor scrolls away before the landing drawing finishes, start warming up anyway. */
const WARMUP_FALLBACK_MS = 8000;
import './Projects.css';

export function Projects() {
  useEffect(() => {
    const t = setTimeout(startWarmup, WARMUP_FALLBACK_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="projects" className="section projects" aria-labelledby="projects-heading">
      <MarginDoodles set="projects" />
      <SectionHeading id="projects-heading" text="Projects" color="var(--crayon-orange)" />
      <p className="projects__intro">
        One box per project, and every box is decorated to match. Hover over one (or scroll it to the middle on your
        phone) to wake it up.
      </p>
      <ul className="projects__grid">
        {projects.map((project) => (
          <li key={project.id}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </section>
  );
}
