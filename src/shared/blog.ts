/**
 * Blog posts: one Markdown file each in content/blog/, named <slug>.md (the address becomes /blog/<slug>).
 * Shared by the blog pages and the sketchpad's AI, which answers from the same posts.
 *
 * A post starts with a small header between --- lines:
 *
 *   ---
 *   title: How Recursion Hell survived event day
 *   date: 2026-11-20
 *   summary: One line for the list of posts.
 *   tags: [backend, devday]
 *   draft: true
 *   ---
 *
 * Only `title` and `date` are needed. Drafts show in local dev only (with a "draft" stamp), never live,
 * and the AI doesn't read them. Files whose name starts with "_" (like _template.md) are ignored.
 */

export interface Post {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
  /** The Markdown after the header. */
  body: string;
}

const HEADER = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

const unquote = (v: string) => v.trim().replace(/^(['"])(.*)\1$/, '$2');

/** Read a post file. Missing or broken header fields fall back to something sensible. */
export function parsePost(slug: string, raw: string): Post {
  const m = raw.match(HEADER);
  const fields: Record<string, string> = {};
  for (const line of (m?.[1] ?? '').split(/\r?\n/)) {
    const at = line.indexOf(':');
    if (at > 0) fields[line.slice(0, at).trim().toLowerCase()] = line.slice(at + 1).trim();
  }
  const tags = (fields.tags ?? '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(unquote)
    .filter(Boolean);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(unquote(fields.date ?? '')) ? unquote(fields.date!) : '1970-01-01';
  return {
    slug,
    title: unquote(fields.title ?? '') || slug.replace(/-/g, ' '),
    date,
    summary: unquote(fields.summary ?? ''),
    tags,
    draft: /^(true|yes)$/i.test(unquote(fields.draft ?? '')),
    body: (m ? raw.slice(m[0].length) : raw).trim(),
  };
}

/** A file name to its slug, or null for files that aren't posts (README, _template, not .md). */
export function slugOf(fileName: string): string | null {
  const name = fileName.split(/[\\/]/).pop() ?? '';
  if (!name.endsWith('.md') || name.startsWith('_') || name === 'README.md') return null;
  return name.slice(0, -3);
}

/** Newest first. */
export const byDate = (a: Post, b: Post) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title);

/** "20 Nov 2026" */
export function formatDate(date: string): string {
  const [y, mo, d] = date.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[(mo ?? 1) - 1]} ${y}`;
}
