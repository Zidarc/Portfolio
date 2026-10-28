import type { ThemeSceneProps } from './theme.ts';

/** Shown inside boxes whose theme hasn't been built yet. */
export function PlaceholderScene({ project }: ThemeSceneProps) {
  const initials = project.name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .map((w) => w[0])
    .join('')
    .slice(0, 3);

  return (
    <div className="placeholder-scene">
      <span className="placeholder-scene__initials">{initials}</span>
      <span className="placeholder-scene__note">themed box coming soon</span>
    </div>
  );
}
