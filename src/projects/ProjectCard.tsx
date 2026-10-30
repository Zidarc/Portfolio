import { Suspense, useEffect, useRef, useState, type CSSProperties, type FocusEvent, type RefObject } from 'react';
import { CrayonShape } from '../crayon/CrayonShape.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { whenScrollSettles } from '../crayon/scrollIdle.ts';
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
  /** Lab only: keep the scene in its active state. */
  forceActive?: boolean;
}

const NO_ELEMENT: RefObject<HTMLElement | null> = { current: null };

/** One crayon box per project: a themed scene on top, the write-up underneath. */
export function ProjectCard({ project, forceActive = false }: ProjectCardProps) {
  const ref = useRef<HTMLElement>(null);
  const nearby = useInView(ref, { rootMargin: '400px 0px', background: true });
  const warm = useWarm(project.id);
  const touch = useMediaQuery('(hover: none)');
  // only phones wake the centred box; with a mouse, watching it just re-rendered every card scrolling past
  const centred = useInView(touch ? ref : NO_ELEMENT, { once: false, rootMargin: '-35% 0px -35% 0px' });
  const narrow = useMediaQuery('(max-width: 600px)');
  const reducedMotion = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // Wheel-scrolling with the mouse over the page "hovers" every box that slides under it, which woke each
  // scene for a moment as it went past. So a box only wakes once the page is still and the mouse is on it.
  const stopWaiting = useRef<() => void>(undefined);
  useEffect(() => () => stopWaiting.current?.(), []);
  const onPointerEnter = (e: { pointerType: string }) => {
    if (e.pointerType !== 'mouse') return;
    stopWaiting.current?.();
    stopWaiting.current = whenScrollSettles(() => ref.current?.matches(':hover') && setHovered(true));
  };
  const onPointerLeave = () => {
    stopWaiting.current?.();
    setHovered(false);
  };

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
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
    >
      <CrayonShape shape="box" instant color={accent} />

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
          {/* box and name are already drawn: twelve cards drawing in was a lot of work for little */}
          <CrayonText text={project.name} decorative instant capHeight={narrow ? 22 : 28} color={accent} />
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
