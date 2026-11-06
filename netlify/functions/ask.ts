import { askConfigFromEnv, handleAsk } from '../../server/ask.ts';
import { blobStore } from '../../server/store.ts';

// one store for the answer cache, the rate limit and the question log, shared by every instance
const store = blobStore('ask');

/** Netlify Function behind POST /api/ask (the sketchpad's AI mode). Env vars are set in the Netlify UI. */
export default async (req: Request, context: { ip?: string; waitUntil?: (work: Promise<unknown>) => void }) => {
  if (req.method !== 'POST') return Response.json({ ok: false, code: 'bad-request', error: 'Method not allowed' }, { status: 405 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, code: 'bad-request', error: 'Bad request' }, { status: 400 });
  }

  const result = await handleAsk(body, {
    config: askConfigFromEnv(process.env),
    clientIp: context.ip ?? 'unknown',
    store,
    waitUntil: context.waitUntil?.bind(context),
  });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/ask' };
