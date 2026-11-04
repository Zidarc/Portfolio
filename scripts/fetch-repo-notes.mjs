// Pulls each project's README and GitHub description into content/ai/repos/, so the sketchpad's AI can
// answer questions about how the projects work. Re-run whenever the repos change, then commit the result.
//
// Usage:
//   node scripts/fetch-repo-notes.mjs
//
// Uses GitHub's public API without a token (60 requests an hour is plenty). Repos come from
// src/data/projects.ts; a README longer than MAX_CHARS is cut, so one huge README can't crowd out the rest.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const MAX_CHARS = 6000;
const OUT = 'content/ai/repos';

// read the repo links straight out of the data file (it's TypeScript, so no import)
const source = readFileSync('src/data/projects.ts', 'utf8');
// one { ... } block per project (none of them nest braces), and only the ones that have a repo
const projects = [...source.matchAll(/\{[^{}]*\bid: '[^']+'[^{}]*\}/g)]
  .map(([block]) => ({
    id: block.match(/\bid: '([^']+)'/)?.[1],
    name: block.match(/\bname: (['"])(.+?)\1/)?.[2],
    repo: block.match(/\brepo: '(https:\/\/github\.com\/[^']+)'/)?.[1]?.replace(/\/$/, ''),
  }))
  .filter((p) => p.id && p.name && p.repo);

const api = async (path, accept = 'application/vnd.github+json') => {
  const res = await fetch(`https://api.github.com${path}`, { headers: { accept, 'user-agent': 'portfolio-repo-notes' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return accept.endsWith('raw') ? res.text() : res.json();
};

/** README Markdown, minus things that mean nothing as text (images, badges, HTML) and runs of blank lines. */
const tidy = (md) =>
  md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const p of projects) {
  const slug = new URL(p.repo).pathname.slice(1);
  const [meta, readme] = await Promise.all([api(`/repos/${slug}`), api(`/repos/${slug}/readme`, 'application/vnd.github.raw')]);
  if (!meta) {
    console.warn(`skip ${p.name}: ${slug} not found (private or renamed?)`);
    continue;
  }
  let body = readme ? tidy(readme) : '(no README)';
  if (body.length > MAX_CHARS) body = `${body.slice(0, MAX_CHARS)}\n\n(README cut short here)`;
  const facts = [
    `- Repository: ${p.repo}`,
    meta.description && `- GitHub description: ${meta.description}`,
    meta.language && `- Main language: ${meta.language}`,
    meta.topics?.length && `- Topics: ${meta.topics.join(', ')}`,
    meta.homepage && `- Live site: ${meta.homepage}`,
    `- Last pushed: ${meta.pushed_at?.slice(0, 10)}`,
  ].filter(Boolean);
  writeFileSync(`${OUT}/${p.id}.md`, `# ${p.name}: the repository\n\n${facts.join('\n')}\n\n## README\n\n${body}\n`);
  console.log(`${p.id}: ${body.length} chars`);
}
