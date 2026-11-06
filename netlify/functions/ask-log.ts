import { handleAskLog } from '../../server/ask-log.ts';
import { blobStore } from '../../server/store.ts';

const store = blobStore('ask');

/** Netlify Function behind GET /api/ask-log: the AI's recent questions, for Ali (needs ASK_LOG_KEY). */
export default async (req: Request) => {
  const result = await handleAskLog(store, {
    key: process.env.ASK_LOG_KEY,
    auth: req.headers.get('authorization'),
    days: new URL(req.url).searchParams.get('days'),
  });
  return Response.json(result.body, { status: result.status, headers: { 'cache-control': 'no-store' } });
};

export const config = { path: '/api/ask-log' };
