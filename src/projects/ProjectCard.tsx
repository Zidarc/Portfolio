import { Suspense, useRef, useState, type CSSProperties, type FocusEvent } from 'react';
import { CrayonShape } from '../crayon/CrayonShape.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { usePrefersReducedMotion } from '../crayon/usePrefersReducedMotion.ts';
import type { Project } from '../data/projects.ts';
import { useInView } from '../hooks/useInView.ts';
import { useMediaQuery } from '../hooks/useMediaQuery.ts';
import { PlaceholderScene } from './PlaceholderScene.tsx';
import { themeMeta, themeScene } from './registry.ts';
import { useWarm } from './warmup.ts';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
  /** Stagger for the outline drawing when several boxes appear together. */
  delay?: number;
  /** Lab only: keep the scene in its active state. */
  forceActive?: boolean;
}

/** One crayon box per project: a themed scene on top, the write-up underneath. */
export function ProjectCard({ project, delay = 0, forceActive = false }: ProjectCardProps) {
  const ref = useRef<HTMLElement>(null);
  const drawn = useInView(ref);
  const nearby = useInView(ref, { rootMargin: '400px 0px' });
  const warm = useWarm(project.id);
  const centred = useInView(ref, { once: false, rootMargin: '-35% 0px -35% 0px' });
  const touch = useMediaQuery('(hover: none)');
  const narrow = useMediaQuery('(max-width: 600px)');
  const reducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // Only the box you're looking at moves: the one under the mouse, or the centred one on a phone.
  // Everything else sits in a still frame, so scrolling never paints a scene.
  const active = forceActive || hovered || focused || (touch && centred);
  const meta = themeMeta(project.theme);
  const Scene = themeScene(project.theme) ?? PlaceholderScene;
  const accent = meta?.accent ?? 'var(--crayon-graphite)';
  const titleId = `project-${project.id}`;

  const onBlur = (e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  return (
    <article
      ref={ref}
      className={`project-card ${active ? 'is-active' : ''}`}
      style={{ '--accent': accent } as CSSProperties}
      aria-labelledby={titleId}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
    >
      <CrayonShape shape="box" play={drawn} delay={delay} tempo={1.6} color={accent} />

      <div
        className={`project-card__scene ${active ? '' : 'is-asleep'}`}
        style={{ background: meta?.background }}
        aria-hidden="true"
      >
        {(nearby || warm) && (
          <Suspense fallback={null}>
            <Scene project={project} active={active} visible={active} reducedMotion={reducedMotion} />
          </Suspense>
        )}
        {project.stamp && <span className="project-card__stamp">{project.stamp}</span>}
      </div>

      <div className="project-card__body">
        <h3 id={titleId} className="project-card__title">
          <span className="sr-only">{project.name}</span>
          <CrayonText
            text={project.name}
            decorative
            play={drawn}
            delay={delay + 300}
            capHeight={narrow ? 22 : 28}
            tempo={1.5}
            color={accent}
          />
        </h3>
        <p className="project-card__tagline">{project.tagline}</p>
        <p className="project-card__description">{project.description}</p>

        {project.stack.length > 0 && (
          <ul className="project-card__stack" aria-label="Built with">
            {project.stack.map((tech) => (
              <li key={tech} className="chip">
                {tech}
              </li>
            ))}
          </ul>
        )}

        {(project.repo || project.live) && (
          <p className="project-card__links">
            {project.live && (
              <a href={project.live} target="_blank" rel="noreferrer">
                see it live ↗<span className="sr-only"> ({project.name})</span>
              </a>
            )}
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noreferrer">
                code ↗<span className="sr-only"> ({project.name} on GitHub)</span>
              </a>
            )}
          </p>
        )}
      </div>
    </article>
  );
}
