import { useState } from 'react';
import { projects } from '../data/projects.ts';
import { ProjectCard } from '../projects/ProjectCard.tsx';

/**
 * Project box test bench: `?projects` shows every box; `?projects&theme=<theme-id>` shows just one.
 * "Force active" keeps scenes in their hover state so you can work on it without hovering.
 */
export function ProjectLab() {
  const params = new URLSearchParams(window.location.search);
  const only = params.get('theme');
  const [forceActive, setForceActive] = useState(params.has('active'));
  const [width, setWidth] = useState(Number(params.get('width') ?? 520));
  const shown = only ? projects.filter((p) => p.theme === only) : projects;

  return (
    <main style={{ display: 'grid', justifyItems: 'center', gap: '2.5rem', padding: '2rem var(--gutter) 6rem' }}>
      <form style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <label>
          <input type="checkbox" checked={forceActive} onChange={(e) => setForceActive(e.target.checked)} /> force active
        </label>
        <label>
          box width {width}px{' '}
          <input type="range" min={300} max={720} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        </label>
        <span style={{ color: 'var(--ink-soft)' }}>{only ? `theme: ${only}` : `${shown.length} boxes`}</span>
      </form>
      {shown.map((p) => (
        <div key={p.id} style={{ width: `min(${width}px, 100%)` }}>
          <ProjectCard project={p} forceActive={forceActive} />
        </div>
      ))}
    </main>
  );
}
