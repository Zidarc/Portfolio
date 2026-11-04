/**
 * What the sketchpad's AI knows: the rules it follows (content/ai/rules.md) and what it can answer from.
 * That's the site's own data (roles, skills, projects, links, so it never goes stale) plus every other
 * Markdown file in content/ai/ (the CV, blog posts, notes). Read once per server instance.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GITHUB_URL, LINKEDIN_URL, RESUME_URL } from '../src/data/links.ts';
import { projects } from '../src/data/projects.ts';
import { roles } from '../src/data/roles.ts';
import { skillGroups } from '../src/data/skills.ts';

export interface Material {
  rules: string;
  /** Everything it may answer from, as one Markdown document. */
  knowledge: string;
}

/** Where content/ai/ is: next to the code locally and in Docker, bundled alongside the function on Netlify. */
const DIRS = [process.env.AI_CONTENT_DIR, join(process.cwd(), 'content', 'ai')].filter((d): d is string => !!d);

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

let cached: Promise<Material> | null = null;

async function read(): Promise<Material> {
  for (const dir of DIRS) {
    let names: string[];
    try {
      names = (await readdir(dir)).filter((n) => n.endsWith('.md') && n !== 'README.md').sort();
    } catch {
      continue; // not here: try the next place
    }
    // (HTML comments are notes to whoever edits the file, not to the AI)
    const text = async (n: string) => (await readFile(join(dir, n), 'utf8')).replace(/<!--[\s\S]*?-->/g, '').trim();
    const files = await Promise.all(names.map(async (n) => [n, await text(n)] as const));
    const rules = files.find(([n]) => n === 'rules.md')?.[1] ?? '';
    const docs = files.filter(([n]) => n !== 'rules.md').map(([n, text]) => `## From ${n}\n\n${text}`);
    return { rules, knowledge: [siteFacts(), ...docs].join('\n\n') };
  }
  console.warn('[ask] content/ai/ not found; answering from the website data only');
  return { rules: '', knowledge: siteFacts() };
}

export function loadMaterial(): Promise<Material> {
  cached ??= read().catch((err: unknown) => {
    cached = null; // try again next time
    throw err;
  });
  return cached;
}
