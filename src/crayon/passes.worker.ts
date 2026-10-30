import { buildPasses, type PassJob } from './passes.ts';

/** Builds crayon passes off the main thread (see usePasses.ts). */
onmessage = (e: MessageEvent<{ id: number; job: PassJob }>) => {
  postMessage({ id: e.data.id, passes: buildPasses(e.data.job) });
};
