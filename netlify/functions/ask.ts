import { askConfigFromEnv, handleAsk } from '../../server/ask.ts';

/** Netlify Function behind POST /api/ask (the sketchpad's AI mode). Env vars are set in the Netlify UI. */
export default async (req: Request, context: { ip?: string }) => {
  if (req.method !== 'POST') return Response.json({ ok: false, code: 'bad-request', error: 'Method not allowed' }, { status: 405 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, code: 'bad-request', error: 'Bad request' }, { status: 400 });
  }

  const result = await handleAsk(body, { config: askConfigFromEnv(process.env), clientIp: context.ip ?? 'unknown' });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/ask' };
