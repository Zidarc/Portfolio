import { useRef, useState } from 'react';
import type { Stroke } from './brush.ts';

/**
 * The sketchpad's endless canvas. Strokes are stored in canvas ("world") units; the view says which
 * world point is at the surface's top-left (x, y) and how far it's zoomed (z). On screen, a world point
 * w sits at (w - x) * z.
 *
 * At zoom 1 with x = -width / 2 and y = 0, world points are measured from the top centre of the
 * sheet, which is exactly how strokes were stored before the canvas became endless, so old
 * drawings need no converting.
 */
export interface View {
  x: number;
  y: number;
  z: number;
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/** Where the sheet starts: zoom 1, world 0 at the top centre. */
export const homeView = (width: number): View => ({ x: -width / 2, y: 0, z: 1 });

/** The view zoomed by `factor`, keeping the world point under screen point (sx, sy) where it is. */
export function zoomAt(v: View, factor: number, sx: number, sy: number): View {
  const z = clampZoom(v.z * factor);
  return { x: v.x + sx / v.z - sx / z, y: v.y + sy / v.z - sy / z, z };
}

const boxes = new WeakMap<Stroke, Box>();

/** A stroke's bounding box in world units, line width included (worked out once per stroke). */
export function strokeBox(s: Stroke): Box {
  let box = boxes.get(s);
  if (box) return box;
  box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (let i = 0; i < s.p.length; i += 2) {
    box.x0 = Math.min(box.x0, s.p[i]!);
    box.x1 = Math.max(box.x1, s.p[i]!);
    box.y0 = Math.min(box.y0, s.p[i + 1]!);
    box.y1 = Math.max(box.y1, s.p[i + 1]!);
  }
  const pad = s.s / 2 + 2;
  box = { x0: box.x0 - pad, y0: box.y0 - pad, x1: box.x1 + pad, y1: box.y1 + pad };
  boxes.set(s, box);
  return box;
}

/** The box around everything drawn, or null for an empty sheet. */
export function drawingBox(strokes: Stroke[]): Box | null {
  if (!strokes.length) return null;
  return strokes.map(strokeBox).reduce((a, b) => ({
    x0: Math.min(a.x0, b.x0),
    y0: Math.min(a.y0, b.y0),
    x1: Math.max(a.x1, b.x1),
    y1: Math.max(a.y1, b.y1),
  }));
}

export const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** The view that shows the whole box with a margin, never zoomed in past 100%. */
export function fitView(box: Box, width: number, height: number): View {
  const pad = 40;
  const z = clampZoom(Math.min(1, (width - pad * 2) / (box.x1 - box.x0), (height - pad * 2) / (box.y1 - box.y0)));
  return {
    x: (box.x0 + box.x1) / 2 - width / 2 / z,
    y: (box.y0 + box.y1) / 2 - height / 2 / z,
    z,
  };
}

/** The part of the world on screen, plus `margin` screens' worth around it (for skipping far-off strokes). */
export function visibleBox(v: View, width: number, height: number, margin = 1): Box {
  const w = width / v.z;
  const h = height / v.z;
  return { x0: v.x - w * margin, y0: v.y - h * margin, x1: v.x + w * (1 + margin), y1: v.y + h * (1 + margin) };
}

function loadView(key: string): View | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(key) ?? 'null') as View | null;
    return v && [v.x, v.y, v.z].every(Number.isFinite) ? { ...v, z: clampZoom(v.z) } : null;
  } catch {
    return null;
  }
}

/**
 * Where the sketchpad is looking, kept for the session under `key`. Until the visitor moves it,
 * it's the home view (which depends on the sheet's width, hence `size`).
 */
export function useCamera(key: string) {
  const [saved, setSaved] = useState<View | null>(() => loadView(key));
  /** The surface's size on screen, set by the surface as it measures itself. */
  const size = useRef({ width: 0, height: 0 });
  /** The view right now (worked out when asked, since the size is only known once the surface is up). */
  const current = () => saved ?? homeView(size.current.width);
  const middle = () => [size.current.width / 2, size.current.height / 2] as const;

  const commit = (v: View) => {
    setSaved(v);
    try {
      sessionStorage.setItem(key, JSON.stringify(v));
    } catch {
      // storage blocked: the view just isn't remembered
    }
  };

  return {
    /** The visitor's view, or null while it's still the home view. */
    saved,
    size,
    current,
    commit,
    /** Zoom by `factor` around the middle of the sheet. */
    zoomBy: (factor: number) => commit(zoomAt(current(), factor, ...middle())),
    /** Back to 100%, keeping the middle of the screen where it is. */
    actualSize: () => commit(zoomAt(current(), 1 / current().z, ...middle())),
    /** Show everything drawn so far (or the start of the sheet if it's empty). */
    fit: (strokes: Stroke[]) => {
      const box = drawingBox(strokes);
      commit(box ? fitView(box, size.current.width, size.current.height) : homeView(size.current.width));
    },
  };
}

export type Camera = ReturnType<typeof useCamera>;
