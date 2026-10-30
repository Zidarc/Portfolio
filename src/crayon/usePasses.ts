import { useEffect, useState } from 'react';
import { buildPasses, type PassJob } from './passes.ts';
import type { CrayonPlan, PlannedPass } from './strokes.ts';

/*
 * Building a drawing's crayon passes (the wobble maths and the path strings) is most of the work of
 * planning it, so it happens in a worker: a screenful of lettering no longer holds up scrolling and taps.
 * If the worker can't start, the passes are built here instead, as before.
 */

type Passes = PlannedPass[][];

let worker: Worker | null | undefined;
let nextId = 0;
const waiting = new Map<number, { job: PassJob; resolve: (passes: Passes) => void }>();
const requested = new WeakMap<CrayonPlan, Promise<Passes>>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('./passes.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; passes: Passes }>) => {
      waiting.get(e.data.id)?.resolve(e.data.passes);
      waiting.delete(e.data.id);
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
      for (const [id, w] of waiting) {
        waiting.delete(id);
        w.resolve(buildPasses(w.job));
      }
    };
  } catch {
    worker = null;
  }
  return worker;
}

/** Starts building `plan`'s passes (once per plan). */
export function requestPasses(plan: CrayonPlan): Promise<Passes> {
  let passes = requested.get(plan);
  if (!passes) {
    const job: PassJob = { strokes: plan.strokes, messiness: plan.messiness, pxPerUnit: plan.pxPerUnit };
    const w = getWorker();
    passes = w
      ? new Promise<Passes>((resolve) => {
          const id = nextId++;
          waiting.set(id, { job, resolve });
          w.postMessage({ id, job });
        })
      : Promise.resolve().then(() => buildPasses(job));
    requested.set(plan, passes);
  }
  return passes;
}

/**
 * `ready`: the passes for `plan`, once built. `shown`: what to draw meanwhile, which is the last plan's
 * passes (so a resized outline doesn't blink) or null.
 */
export function usePasses(plan: CrayonPlan) {
  // asked for during render, not after it: the worker builds while React renders the rest of the page
  void requestPasses(plan);
  const [shown, setShown] = useState<{ plan: CrayonPlan; passes: Passes } | null>(null);

  useEffect(() => {
    let live = true;
    void requestPasses(plan).then((passes) => live && setShown({ plan, passes }));
    return () => {
      live = false;
    };
  }, [plan]);

  return { shown, ready: shown?.plan === plan ? shown.passes : null };
}
