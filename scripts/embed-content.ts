// Works out the meaning (an embedding) of every section the sketchpad's AI can look up, so questions
// find the right sections even when they use other words ("trading competition" → Synergy). Saved to
// content/ai/embeddings.json and committed; run it again after changing content/ai/repos or the blog.
// Sections changed since the last run fall back to word matching until then, so a stale file is safe.
//
// Usage (from the repo root, with CF_ACCOUNT_ID and CF_AI_TOKEN in .env.local or the shell):
//   node scripts/embed-content.ts

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EMBED_FILE, EMBED_MODEL, embed, loadMaterial, packVector } from '../server/ask-material.ts';

const env = { ...process.env };
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !env[m[1]!]) env[m[1]!] = m[2]!.trim();
  }
}
if (!env.CF_ACCOUNT_ID || !env.CF_AI_TOKEN) {
  console.error('Needs CF_ACCOUNT_ID and CF_AI_TOKEN (see docs/ai-setup.md).');
  process.exit(1);
}
const cf = { account: env.CF_ACCOUNT_ID.trim(), token: env.CF_AI_TOKEN.trim() };

const { chunks } = await loadMaterial();
const vectors: Record<string, string> = {};
const BATCH = 50;
for (let i = 0; i < chunks.length; i += BATCH) {
  const batch = chunks.slice(i, i + BATCH);
  const out = await embed(cf, batch.map((c) => c.text), 30_000);
  batch.forEach((c, j) => (vectors[c.id] = packVector(out[j]!)));
  console.log(`${Math.min(i + BATCH, chunks.length)}/${chunks.length} sections`);
}

const path = join('content', 'ai', EMBED_FILE);
writeFileSync(path, `${JSON.stringify({ model: EMBED_MODEL, made: new Date().toISOString().slice(0, 10), vectors }, null, 0)}\n`);
console.log(`Saved ${Object.keys(vectors).length} embeddings to ${path}.`);
