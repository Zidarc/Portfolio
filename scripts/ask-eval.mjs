// Checks the sketchpad's AI against a fixed set of questions (scripts/ask-eval.json): does each answer
// mention what it must, and nothing it mustn't (made-up facts, off-topic help, private details)?
// Run it after changing the model, content/ai/rules.md or what the AI knows, and compare.
//
// Usage (with `npm run dev` running, real AI keys in .env.local and AI_PRACTICE unset):
//   node scripts/ask-eval.mjs                       # against localhost:5173
//   node scripts/ask-eval.mjs http://localhost:5174 # another port
//   node scripts/ask-eval.mjs <origin> recursion    # only the questions containing "recursion"
//
// It sends a few questions per request and waits between requests, to stay under the rate limit
// (6 a minute). Exits with 1 if any check fails.
//
// Mind the cost: it uses the same free allowance as the live site. On Cloudflare's free plan one full
// run is roughly a quarter of the day's 10,000 neurons, so a few runs leave visitors "out of crayons"
// until midnight UTC. Use the filter to re-check just the questions you changed.

import { readFileSync } from 'node:fs';

const [origin = 'http://localhost:5173', filter = ''] = process.argv.slice(2);
const { cases: all } = JSON.parse(readFileSync(new URL('./ask-eval.json', import.meta.url), 'utf8'));
const cases = all.filter((c) => c.q.toLowerCase().includes(filter.toLowerCase()));

const PER_REQUEST = 4;
const GAP_MS = 11_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const matches = (pattern, text) => new RegExp(pattern, 'i').test(text);

// questions with history go on their own (history belongs to the whole sheet); the rest in small batches
const batches = [];
const plain = cases.filter((c) => !c.history);
for (let i = 0; i < plain.length; i += PER_REQUEST) batches.push(plain.slice(i, i + PER_REQUEST));
for (const c of cases.filter((c) => c.history)) batches.push([c]);

/** What's wrong with an answer, if anything. */
function check(c, item) {
  const problems = [];
  const answer = item?.answer ?? '';
  const kind = item?.kind ?? 'missing';
  if (c.kind && kind !== c.kind) problems.push(`kind is ${kind}, wanted ${c.kind}`);
  if (!c.kind && kind !== 'question' && kind !== 'statement') problems.push(`kind is ${kind}`);
  if ((kind === 'question' || kind === 'statement') && !answer) problems.push('no answer');
  for (const group of c.expect ?? []) if (!group.some((p) => matches(p, answer))) problems.push(`missing one of: ${group.join(' / ')}`);
  for (const p of c.forbid ?? []) if (matches(p, answer)) problems.push(`says /${p}/`);
  const words = answer.split(/\s+/).filter(Boolean).length;
  if (words > 60) problems.push(`${words} words (too long to handwrite)`);
  return problems;
}

let failed = 0;
let slowest = 0;
const providers = new Map();
for (const [b, batch] of batches.entries()) {
  if (b > 0) await sleep(GAP_MS);
  const typed = batch.map((c, i) => ({ id: `e${b}x${i}`, text: c.q }));
  const body = { typed, marks: [], ...(batch[0].history ? { history: batch[0].history } : {}) };
  const started = Date.now();
  let reply;
  try {
    const res = await fetch(new URL('/api/ask', origin), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    reply = await res.json();
  } catch (err) {
    reply = { ok: false, error: String(err) };
  }
  const ms = Date.now() - started;
  slowest = Math.max(slowest, ms);
  if (!reply.ok) {
    for (const c of batch) console.log(`FAIL  ${c.q}\n      request failed: ${reply.code ?? ''} ${reply.error}`);
    failed += batch.length;
    continue;
  }
  providers.set(reply.provider, (providers.get(reply.provider) ?? 0) + 1);
  batch.forEach((c, i) => {
    const item = reply.items.find((it) => it.ref === `t:${typed[i].id}`);
    const problems = check(c, item);
    if (problems.length) failed++;
    console.log(`${problems.length ? 'FAIL' : 'pass'}  ${c.q}${c.history ? '  (follow-up)' : ''}`);
    console.log(`      → ${item?.answer ?? `(${item?.kind ?? 'nothing'})`}`);
    for (const p of problems) console.log(`      ✗ ${p}`);
  });
  console.log(`      [${ms} ms, ${reply.provider}]\n`);
}

const used = [...providers].map(([p, n]) => `${p} ×${n}`).join(', ');
console.log(`${cases.length - failed}/${cases.length} passed. Slowest request ${slowest} ms. Answered by: ${used || 'nobody'}.`);
process.exit(failed ? 1 : 0);
