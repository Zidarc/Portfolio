/**
 * What the sketchpad's AI knows, and picking the part of it that fits each question (a small RAG).
 *
 * Sources:
 * - **always sent ("core")**: the site's own data (roles, skills, projects, links, so it never goes
 *   stale), plus the Markdown at the top of content/ai/ (cv.md, about.md, …)
 * - **looked up per question**: the project repos' READMEs (content/ai/repos/, from
 *   scripts/fetch-repo-notes.mjs) and the blog posts (content/blog/)
 * - **rules**: content/ai/rules.md, how it behaves
 *
 * While everything fits in CONTEXT_BUDGET it is all sent, which is the most accurate. Past that, the
 * looked-up sections are ranked by the words they share with the question, the best are sent, and the
 * rest are listed by title so the AI knows they exist. Read once per server instance.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { GITHUB_URL, LINKEDIN_URL, RESUME_URL } from '../src/data/links.ts';
import { projects } from '../src/data/projects.ts';
import { roles } from '../src/data/roles.ts';
import { skillGroups } from '../src/data/skills.ts';
import { readPosts } from './blog.ts';

/** Characters of material sent with one question (about 15k tokens). */
export const CONTEXT_BUDGET = 60_000;
/** Looked-up sections are cut into pieces of about this size. */
const CHUNK_CHARS = 2_500;

export interface Chunk {
  /** e.g. "repos/gcc.md › Features" */
  title: string;
  text: string;
  terms: Map<string, number>;
}

export interface Material {
  rules: string;
  core: string;
  chunks: Chunk[];
  /** How many chunks contain each term (for weighting rare words higher). */
  df: Map<string, number>;
}

/** content/ (with ai/ and blog/ in it): next to the code locally and in Docker, bundled with the function on Netlify. */
const ROOTS = [process.env.AI_CONTENT_DIR, join(process.cwd(), 'content')].filter((d): d is string => !!d);

function siteFacts(): string {
  const roleLines = roles.map((r) => `- ${r.title}, ${r.org} (${r.start} – ${r.end ?? 'now'}). Skills: ${r.skills.join(', ')}.`);
  const projectLines = projects
    .filter((p) => p.id !== 'mystery')
    .map((p) => {
      const links = [p.live && `live: ${p.live}`, p.repo && `code: ${p.repo}`].filter(Boolean).join(', ');
      const stack = p.stack.length ? ` Built with ${p.stack.join(', ')}.` : '';
      return `- **${p.name}**: ${p.tagline}. ${p.description}${stack}${p.stamp ? ` (${p.stamp})` : ''}${links ? ` [${links}]` : ''}`;
    });
  const skillLines = skillGroups.map((g) => `- ${g.title}: ${g.skills.join(', ')}`);
  return [
    '## From the website',
    '### Roles (newest first)',
    ...roleLines,
    '### Projects',
    ...projectLines,
    '### Skills',
    ...skillLines,
    '### Links',
    `- GitHub: ${GITHUB_URL}`,
    `- LinkedIn: ${LINKEDIN_URL}`,
    `- Résumé: ${RESUME_URL}`,
  ].join('\n');
}

// ---------- reading ----------

/** Every .md file under `dir` (but not README.md), as paths relative to `base`, sorted. */
async function markdownFiles(dir: string, base: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const found = await Promise.all(
    entries.map((e) => {
      const path = join(dir, e.name);
      if (e.isDirectory()) return markdownFiles(path, base);
      return e.name.endsWith('.md') && e.name !== 'README.md' ? [relative(base, path).replace(/\\/g, '/')] : [];
    }),
  );
  return found.flat().sort();
}

// (HTML comments are notes to whoever edits a file, not to the AI)
const readText = async (path: string) => (await readFile(path, 'utf8')).replace(/<!--[\s\S]*?-->/g, '').trim();

// ---------- chunking and ranking ----------

const STOP = new Set(
  'a an and are as at be but by can did do does for from had has have he her him his how i if in into is it its me my no not of on or our she so than that the their them then there they this to was we were what when where which who why will with you your about ali hussain'.split(' '),
);

/** Lower-case words of 2+ letters, minus very common ones, with how often each appears. */
export function termsOf(text: string): Map<string, number> {
  const terms = new Map<string, number>();
  for (const w of text.toLowerCase().match(/[a-z0-9+#]{2,}/g) ?? []) {
    if (!STOP.has(w)) terms.set(w, (terms.get(w) ?? 0) + 1);
  }
  return terms;
}

/** A document cut at its headings, and long sections cut again at paragraph breaks. */
function chunksOf(file: string, text: string): Chunk[] {
  const sections = text.split(/\n(?=#{1,3} )/);
  const doc = sections[0]?.match(/^#{1,3} (.+)/)?.[1] ?? file;
  const out: Chunk[] = [];
  for (const section of sections) {
    const heading = section.match(/^#{1,3} (.+)/)?.[1];
    let piece = '';
    const flush = () => {
      if (!piece.trim()) return;
      // each piece says what it's from, so it still makes sense on its own
      const body = `(${doc}${heading && heading !== doc ? ` › ${heading}` : ''})\n${piece.trim()}`;
      out.push({ title: `${file}${heading ? ` › ${heading}` : ''}`, text: body, terms: termsOf(body) });
      piece = '';
    };
    for (const para of section.split(/\n\n+/)) {
      if (piece && piece.length + para.length > CHUNK_CHARS) flush();
      piece += `${para}\n\n`;
    }
    flush();
  }
  return out;
}

/**
 * The material to send with a question: all of it if it fits, else the core plus the looked-up
 * sections that best match `query` (with a list of the rest).
 */
export function knowledgeFor(m: Material, query: string, budget = CONTEXT_BUDGET): string {
  const all = [m.core, ...m.chunks.map((c) => c.text)];
  if (all.reduce((n, t) => n + t.length + 2, 0) <= budget) return all.join('\n\n');

  const q = termsOf(query);
  const n = m.chunks.length;
  const score = (c: Chunk) => {
    let s = 0;
    for (const [term] of q) {
      const tf = c.terms.get(term);
      if (tf) s += (1 + Math.log(tf)) * Math.log(1 + n / (m.df.get(term) ?? 1)); // rare words count for more
    }
    return s;
  };
  const ranked = m.chunks.map((c, i) => ({ c, i, s: score(c) })).sort((a, b) => b.s - a.s || a.i - b.i);

  let left = budget - m.core.length - 2_000; // room for the list of what's left out
  const picked: typeof ranked = [];
  const skipped: Chunk[] = [];
  for (const r of ranked) {
    if (r.s > 0 && r.c.text.length <= left) {
      picked.push(r);
      left -= r.c.text.length + 2;
    } else skipped.push(r.c);
  }
  picked.sort((a, b) => a.i - b.i); // back in reading order
  const titles = [...new Set(skipped.map((c) => c.title))].slice(0, 80);
  const also = titles.length ? `\n\n## Also written about (not included here; say where to read more if asked)\n${titles.map((t) => `- ${t}`).join('\n')}` : '';
  return [m.core, ...picked.map((r) => r.c.text)].join('\n\n') + also;
}

// ---------- loading ----------

async function read(): Promise<Material> {
  for (const root of ROOTS) {
    const ai = join(root, 'ai');
    const files = await markdownFiles(ai, ai);
    // published posts only (no drafts), the same ones the blog shows
    const posts = await readPosts(join(root, 'blog'));
    if (!files.length && !posts.length) continue; // not here: try the next place

    const rules = files.includes('rules.md') ? await readText(join(ai, 'rules.md')) : '';
    const topLevel = files.filter((f) => !f.includes('/') && f !== 'rules.md');
    const notes = files.filter((f) => f.includes('/'));

    const core = [siteFacts(), ...(await Promise.all(topLevel.map(async (f) => `## From ${f}\n\n${await readText(join(ai, f))}`)))].join('\n\n');
    const noteChunks = await Promise.all(notes.map(async (f) => chunksOf(f, await readText(join(ai, f)))));
    const postChunks = posts.map((p) => {
      const intro = `# Blog post: ${p.title}\n\nPublished ${p.date} at /blog/${p.slug}.${p.tags.length ? ` Tags: ${p.tags.join(', ')}.` : ''}${p.summary ? ` ${p.summary}` : ''}`;
      return chunksOf(`blog/${p.slug}.md`, `${intro}\n\n${p.body.replace(/<!--[\s\S]*?-->/g, '')}`);
    });
    const chunks = [...noteChunks, ...postChunks].flat();
    const df = new Map<string, number>();
    for (const c of chunks) for (const term of c.terms.keys()) df.set(term, (df.get(term) ?? 0) + 1);
    return { rules, core, chunks, df };
  }
  console.warn('[ask] content/ not found; answering from the website data only');
  return { rules: '', core: siteFacts(), chunks: [], df: new Map() };
}

let cached: Promise<Material> | null = null;

export function loadMaterial(): Promise<Material> {
  cached ??= read().catch((err: unknown) => {
    cached = null; // try again next time
    throw err;
  });
  return cached;
}
