import { handleContact, mailConfigFromEnv } from '../../server/contact.ts';

/** Netlify Function behind POST /api/contact. Env vars are set in the Netlify UI. */
export default async (req: Request, context: { ip?: string }) => {
  if (req.method !== 'POST') return Response.json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }

  const result = await handleContact(body, {
    config: mailConfigFromEnv(process.env),
    clientIp: context.ip ?? 'unknown',
  });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/contact' };
