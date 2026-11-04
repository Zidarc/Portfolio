/**
 * Reads the blog posts in content/blog/ (format: src/shared/blog.ts). Used at build time by the blog
 * pages (vite.config.ts) and at run time by the sketchpad's AI (server/ask-material.ts), so both see the
 * same posts.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { byDate, parsePost, slugOf, type Post } from '../src/shared/blog.ts';

/** Every post in `dir`, newest first. Drafts only when asked for (local dev). */
export async function readPosts(dir: string, { drafts = false } = {}): Promise<Post[]> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return []; // no blog folder yet
  }
  const posts = await Promise.all(
    names.map(async (name) => {
      const slug = slugOf(name);
      return slug ? parsePost(slug, await readFile(join(dir, name), 'utf8')) : null;
    }),
  );
  return posts.filter((p): p is Post => !!p && (drafts || !p.draft)).sort(byDate);
}
