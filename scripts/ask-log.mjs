// Prints what visitors asked the sketchpad's AI lately, and what it answered (newest first), then the
// questions asked most and the ones it had no notes for.
//
// Usage: set ASK_LOG_KEY (the same value as on Netlify) in the shell or .env.local, then
//   node scripts/ask-log.mjs                                              # live site, last 7 days
//   node scripts/ask-log.mjs https://ali-hussain-portfolio.netlify.app 30 # last 30 days
//   node scripts/ask-log.mjs http://localhost:5173                        # the dev server's (memory) log

import { existsSync, readFileSync } from 'node:fs';

const [origin = 'https://ali-hussain-portfolio.netlify.app', days = '7'] = process.argv.slice(2);
let key = process.env.ASK_LOG_KEY;
if (!key && existsSync('.env.local')) key = readFileSync('.env.local', 'utf8').match(/^ASK_LOG_KEY=(.*)$/m)?.[1]?.trim();
if (!key) {
  console.error('Set ASK_LOG_KEY first (the same value as in the Netlify environment variables).');
  process.exit(1);
}

const res = await fetch(new URL(`/api/ask-log?days=${encodeURIComponent(days)}`, origin), { headers: { authorization: `Bearer ${key}` } });
const reply = await res.json();
if (!reply.ok) {
  console.error(`${res.status}: ${reply.error}`);
  process.exit(1);
}

const asked = new Map();
/** Questions it had no notes for (rules.md makes it say "isn't in my notes"): what to add to content/ai next. */
const unanswered = new Map();
const NO_NOTES = /isn't in my notes|not in my notes|isn't on his list|don't know/i;
for (const e of reply.entries) {
  const when = new Date(e.at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  if (e.error) {
    console.log(`${when}  ✗ ${e.error}`);
    continue;
  }
  for (const it of e.items ?? []) {
    console.log(`${when}  [${e.provider}${e.history ? ', follow-up' : ''}] ${it.kind}: ${it.text}`);
    if (it.answer) console.log(`      → ${it.answer}`);
    if (it.kind !== 'question') continue;
    const q = it.text.toLowerCase().replace(/[^a-z0-9+#' ]+/g, ' ').replace(/ +/g, ' ').trim();
    asked.set(q, (asked.get(q) ?? 0) + 1);
    if (it.answer && NO_NOTES.test(it.answer)) unanswered.set(q, (unanswered.get(q) ?? 0) + 1);
  }
}
const top = [...asked].sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log(`\n${reply.entries.length} requests in the last ${reply.days} days.`);
if (top.length) console.log('Asked most:\n' + top.map(([q, n]) => `  ${n} × ${q}`).join('\n'));
const gaps = [...unanswered].sort((a, b) => b[1] - a[1]);
if (gaps.length) {
  console.log("\nIt had no notes for these (add the answers to content/ai/, e.g. personal.md):");
  console.log(gaps.map(([q, n]) => `  ${n} × ${q}`).join('\n'));
}
