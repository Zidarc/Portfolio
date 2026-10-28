/**
 * The contract between a project box and its themed interior.
 *
 * A theme is a folder: src/projects/themes/<theme-id>/ where <theme-id> is a `ProjectTheme`
 * from data/projects.ts. It needs two files and may add anything else inside its own folder:
 *
 *   meta.ts    `export default { accent, background } satisfies ThemeMeta`  (tiny, loaded up front)
 *   Scene.tsx  `export default function Scene(props: ThemeSceneProps)`     (lazy-loaded near the viewport)
 *
 * The registry discovers folders automatically, so adding a theme never touches shared files.
 */
import type { Project } from '../data/projects.ts';

export interface ThemeMeta {
  /** Crayon colour for the box outline, project name and chips. Any CSS colour. */
  accent: string;
  /** Scene background shown while the Scene chunk loads, so there's no flash of paper. */
  background: string;
}

export interface ThemeSceneProps {
  project: Project;
  /**
   * The visitor is paying attention to this box: hovering it, focused inside it, or
   * (on touch screens) it's in the middle of the screen. Do the theme's "special" thing.
   */
  active: boolean;
  /** The box is on screen. Run animations / timers only while this is true. */
  visible: boolean;
  /** The visitor asked for less motion: show a still, finished-looking frame instead. */
  reducedMotion: boolean;
}
