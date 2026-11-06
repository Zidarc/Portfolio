/**
 * GET /api/ask-log: what visitors have asked the sketchpad's AI lately, and what it answered, so Ali
 * can see what people want to know (and add it to content/ai/). No IPs or anything about the visitor
 * are kept. Locked with ASK_LOG_KEY: without it set, the log can't be read at all.
 *
 *   node scripts/ask-log.mjs https://ali-hussain-portfolio.netlify.app 7
 */
import { timingSafeEqual } from 'node:crypto';
import type { AskStore } from './store.ts';

const MAX_DAYS = 31;
const MAX_ENTRIES = 1_000;

export async function handleAskLog(store: AskStore, opts: { key?: string; auth?: string | null; days?: string | null }) {
  const want = opts.key?.trim();
  const got = (opts.auth ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!want) return { status: 404, body: { ok: false, error: 'Not found' } };
  const same = got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
  if (!same) return { status: 401, body: { ok: false, error: 'Wrong key' } };

  const days = Math.min(MAX_DAYS, Math.max(1, Number(opts.days) || 7));
  const dates = Array.from({ length: days }, (_, i) => new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  const keys = (await Promise.all(dates.map((d) => store.list(`log/${d}/`)))).flat().sort().reverse().slice(0, MAX_ENTRIES);
  const entries = (await Promise.all(keys.map((k) => store.get<unknown>(k)))).filter(Boolean);
  return { status: 200, body: { ok: true, days, entries } };
}
