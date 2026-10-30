import { startTransition, useEffect, useState } from 'react';
import { sceneLoaders } from './registry.ts';

/**
 * Gets the project scenes ready in the background while the visitor is still on the landing page,
 * so scrolling into Projects never has to download, parse and build a scene on the spot.
 * Everything happens in idle time, one piece per slot, so the landing animation keeps its frames.
 */

const listeners = new Set<() => void>();
const queue: string[] = [];
const ready = new Set<string>();
let started = false;

// Safari has no requestIdleCallback
const idle = (fn: () => void) =>
  typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 150);

const nextIdle = () => new Promise<void>((resolve) => idle(resolve));

async function warm() {
  for (const load of sceneLoaders) {
    await nextIdle();
    await load().catch(() => {}); // a failed chunk just loads again when its box scrolls in
  }
  // the fonts those scenes brought with them: laying out text whose web font hadn't loaded yet was the
  // biggest part of the freeze when Projects scrolled in (not awaited, so a slow network holds nothing up)
  await nextIdle();
  if ('fonts' in document) {
    for (const font of document.fonts) if (font.status === 'unloaded') font.load().catch(() => {});
  }
  // then build the boxes' scenes, top to bottom, one per idle slot
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    await nextIdle();
    ready.add(id);
    listeners.forEach((notify) => notify());
  }
}

/** Start warming up. Safe to call more than once; only the first call does anything. */
export function startWarmup() {
  if (started) return;
  started = true;
  void warm();
}

/** True once this box's scene has had its turn to be built in the background. */
export function useWarm(id: string): boolean {
  const [warm, setWarm] = useState(() => ready.has(id));

  useEffect(() => {
    if (ready.has(id)) return;
    if (!queue.includes(id)) queue.push(id);
    const notify = () => {
      // a transition lets React build the scene in small slices instead of one long freeze
      if (ready.has(id)) startTransition(() => setWarm(true));
    };
    listeners.add(notify);
    return () => {
      listeners.delete(notify);
    };
  }, [id]);

  return warm;
}
