import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ProjectTheme } from '../data/projects.ts';
import type { ThemeMeta, ThemeSceneProps } from './theme.ts';

// Theme folders are found by file name, so themes can be added in parallel without a shared list.
const metas = import.meta.glob<{ default: ThemeMeta }>('./themes/*/meta.ts', { eager: true });
const scenes = import.meta.glob<{ default: ComponentType<ThemeSceneProps> }>('./themes/*/Scene.tsx');

/** './themes/<id>/meta.ts' → '<id>' */
const themeIdOf = (path: string) => path.split('/')[2] ?? '';

const META = new Map(Object.entries(metas).map(([path, mod]) => [themeIdOf(path), mod.default]));
const SCENES = new Map<string, LazyExoticComponent<ComponentType<ThemeSceneProps>>>(
  Object.entries(scenes).map(([path, load]) => [themeIdOf(path), lazy(load)]),
);

export const themeMeta = (id: ProjectTheme): ThemeMeta | null => META.get(id) ?? null;
export const themeScene = (id: ProjectTheme) => SCENES.get(id) ?? null;

/** Fetch and parse every Scene chunk now, so mounting one later doesn't wait on the network. */
export const sceneLoaders = Object.values(scenes);
