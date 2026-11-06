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
import { hashOf } from './store.ts';

/** Characters of material sent with one question (about 15k tokens). */
export const CONTEXT_BUDGET = 60_000;
/** Looked-up sections are cut into pieces of about this size. */
const CHUNK_CHARS = 2_500;

export interface Chunk {
  /** A hash of the text: what its embedding is stored under. */
  id: string;
  /** e.g. "repos/gcc.md › Features" */
  title: string;
  text: string;
  terms: Map<string, number>;
}

export interface Page {
  /** What the AI names it by, e.g. "recursion-hell" or "blog/hello-blog". */
  id: string;
  label: string;
  href: string;
}

/** The projects with somewhere to go (the live site, else the code), plus the contact form. */
function sitePages(): Page[] {
  return [
    ...projects.flatMap((p) => (p.id !== 'mystery' && (p.live || p.repo) ? [{ id: p.id, label: p.name, href: (p.live ?? p.repo)! }] : [])),
    { id: 'blog', label: 'the blog', href: '/blog' },
    { id: 'contact', label: 'the contact form', href: '/#contact' },
  ];
}

export interface Material {
  /** Changes whenever any of it does (cached answers are kept per version). */
  version: string;
  /** Places an answer may link to: projects, blog posts, the contact form. */
  pages: Page[];
  rules: string;
  core: string;
  chunks: Chunk[];
  /** Answers for when every AI provider is down (content/ai/faq.md). */
  faq: FaqEntry[];
  /** Each chunk's embedding by its id, if they've been made (see scripts/embed-content.ts). */
  vectors: Map<string, Float32Array> | null;
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
    "- Blog: /blog on this site (Ali's posts)",
    "- Contact: the contact form at the bottom of this site (/#contact)",
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
function chunksOf(file: string, raw: string): Chunk[] {
  // one kind of line ending, so a section's id (the hash its embedding is stored under) is the same on
  // Windows checkouts (CRLF) as on Netlify (LF)
  const text = raw.replace(/\r\n?/g, '\n');
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
      out.push({ id: hashOf(body), title: `${file}${heading ? ` › ${heading}` : ''}`, text: body, terms: termsOf(body) });
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
export function knowledgeFor(m: Material, query: string, budget = CONTEXT_BUDGET, queryVector?: Float32Array): string {
  if (fitsIn(m, budget)) return [m.core, ...m.chunks.map((c) => c.text)].join('\n\n');

  const q = termsOf(query);
  const n = m.chunks.length;
  const words = (c: Chunk) => {
    let s = 0;
    for (const [term] of q) {
      const tf = c.terms.get(term);
      if (tf) s += (1 + Math.log(tf)) * Math.log(1 + n / (m.df.get(term) ?? 1)); // rare words count for more
    }
    return s;
  };
  const wordScores = m.chunks.map(words);
  // with the question's meaning (an embedding), sections that say the same thing in other words rank too
  const meanings = queryVector ? m.chunks.map((c) => m.vectors?.get(c.id)) : [];
  let scores = wordScores;
  if (queryVector && meanings.every(Boolean)) {
    const cos = meanings.map((v) => dot(v!, queryVector));
    const lo = Math.min(...cos);
    const span = Math.max(...cos) - lo || 1;
    const top = Math.max(...wordScores) || 1;
    scores = cos.map((c, i) => MEANING_WEIGHT * ((c - lo) / span) + (1 - MEANING_WEIGHT) * (wordScores[i]! / top));
  }
  const ranked = m.chunks.map((c, i) => ({ c, i, s: scores[i]! })).sort((a, b) => b.s - a.s || a.i - b.i);

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

// ---------- meanings (embeddings) ----------

/** Cloudflare's small English embedding model: free, fast, 384 numbers per text. */
export const EMBED_MODEL = '@cf/baai/bge-small-en-v1.5';
/** Where `node scripts/embed-content.ts` keeps every section's embedding. */
export const EMBED_FILE = 'embeddings.json';
/** How much meaning counts against shared words when ranking (0 to 1). */
const MEANING_WEIGHT = 0.6;

/** True if everything fits in `budget` characters, so nothing needs ranking. */
export const fitsIn = (m: Material, budget: number) => m.core.length + m.chunks.reduce((n, c) => n + c.text.length + 2, 0) <= budget;

const dot = (a: Float32Array, b: Float32Array) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
};

const unit = (v: number[]) => {
  const len = Math.hypot(...v) || 1;
  return Float32Array.from(v, (x) => x / len);
};

/** Stored small: each number as one signed byte (plenty for ranking), base64. */
export const packVector = (v: Float32Array) => Buffer.from(Int8Array.from(v, (x) => Math.round(Math.max(-1, Math.min(1, x * 4)) * 127)).buffer).toString('base64');
const unpackVector = (s: string) => unit([...new Int8Array(Buffer.from(s, 'base64'))]);

/** Embeddings for some texts, from Cloudflare Workers AI, as unit vectors. */
export async function embed(cf: { account: string; token: string }, texts: string[], ms: number): Promise<Float32Array[]> {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cf.account)}/ai/run/${EMBED_MODEL}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${cf.token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ text: texts }),
    signal: AbortSignal.timeout(ms),
  });
  if (!res.ok) throw new Error(`embedding ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { result?: { data?: number[][] } };
  const vectors = data.result?.data;
  if (!vectors || vectors.length !== texts.length) throw new Error('embedding: wrong number of vectors');
  return vectors.map(unit);
}

/** The stored embeddings, by chunk id (only those made with EMBED_MODEL). */
async function readVectors(ai: string): Promise<Map<string, Float32Array> | null> {
  try {
    const file = JSON.parse(await readFile(join(ai, EMBED_FILE), 'utf8')) as { model?: string; vectors?: Record<string, string> };
    if (file.model !== EMBED_MODEL || !file.vectors) return null;
    return new Map(Object.entries(file.vectors).map(([id, s]) => [id, unpackVector(s)]));
  } catch {
    return null; // not made yet: ranking uses shared words only
  }
}

// ---------- the fallback answers ----------

export interface FaqEntry {
  /** Each wording of the question, as a set of its words. */
  questions: Set<string>[];
  answer: string;
  /** A page id for a link under the answer. */
  see?: string;
}

// (these say nothing about which question it is: "what does Ali do" and "what does he do" are the same)
const FAQ_SKIP = new Set('a an the is are was his he him ali alis s me i you can tell'.split(' '));
const faqWords = (q: string) =>
  new Set(
    q
      .toLowerCase()
      .replace(/['’]/g, '')
      .match(/[a-z0-9+#]+/g)
      ?.filter((w) => !FAQ_SKIP.has(w)) ?? [],
  );

/** content/ai/faq.md: "## " lines are wordings of a question, the text under them its answer. */
function parseFaq(text: string): FaqEntry[] {
  const entries: FaqEntry[] = [];
  let current: FaqEntry | null = null;
  let body: string[] = [];
  const flush = () => {
    if (current && body.length) {
      const see = body.find((l) => /^see:/i.test(l));
      current.answer = body.filter((l) => l !== see).join(' ').replace(/\s+/g, ' ').trim();
      if (see) current.see = see.replace(/^see:\s*/i, '').trim();
      if (current.answer) entries.push(current);
    }
    current = null;
    body = [];
  };
  for (const line of text.split('\n').map((l) => l.trim())) {
    const q = line.match(/^## (.+)/)?.[1];
    if (q) {
      if (body.length) flush();
      current ??= { questions: [], answer: '' };
      current.questions.push(faqWords(q));
    } else if (current && line && !line.startsWith('#')) body.push(line);
  }
  flush();
  return entries;
}

/** The fallback answer for a question, if one of the wordings is close enough (most of the words shared). */
export function faqAnswer(m: Material, question: string): FaqEntry | null {
  const words = faqWords(question);
  if (!words.size) return null;
  let best: { e: FaqEntry; score: number } | null = null;
  for (const e of m.faq) {
    for (const q of e.questions) {
      const shared = [...words].filter((w) => q.has(w)).length;
      const score = shared / new Set([...words, ...q]).size;
      if (!best || score > best.score) best = { e, score };
    }
  }
  return best && best.score >= 0.6 ? best.e : null;
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
    const faq = files.includes('faq.md') ? parseFaq(await readText(join(ai, 'faq.md'))) : [];
    const topLevel = files.filter((f) => !f.includes('/') && f !== 'rules.md' && f !== 'faq.md');
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
    const pages = [...sitePages(), ...posts.map((p) => ({ id: `blog/${p.slug}`, label: p.title, href: `/blog/${p.slug}` }))];
    const version = hashOf([rules, core, ...chunks.map((c) => c.text), ...pages.map((p) => `${p.id} ${p.href}`)].join('\n'));
    return { version, pages, rules, core, chunks, df, faq, vectors: await readVectors(ai) };
  }
  console.warn('[ask] content/ not found; answering from the website data only');
  const core = siteFacts();
  return { version: hashOf(core), pages: sitePages(), rules: '', core, chunks: [], df: new Map(), faq: [], vectors: null };
}

let cached: Promise<Material> | null = null;

export function loadMaterial(): Promise<Material> {
  cached ??= read().catch((err: unknown) => {
    cached = null; // try again next time
    throw err;
  });
  return cached;
}
