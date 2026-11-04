/**
 * Vite plugin for the blog. At build time (and live in dev) it reads content/blog/ and provides:
 *
 * - `virtual:blog`: every post's details without the body (for the list of posts), plus a loader for
 *   each post, so a post's text is only downloaded when it's opened
 * - `virtual:blog-post/<slug>`: one post with its Markdown already turned into HTML
 *
 * Drafts are only included in dev, so an unpublished post never ends up in the live site's files.
 * Markdown is converted here, at build time, so the Markdown library never reaches the browser.
 */
import { join } from 'node:path';
import { marked, type Tokens } from 'marked';
import type { Plugin } from 'vite';
import type { Post } from '../src/shared/blog.ts';
import { readPosts } from './blog.ts';

const LIST = 'virtual:blog';
const ONE = 'virtual:blog-post/';

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

marked.use({
  gfm: true,
  // the post title is the page's only h1, so a "#" heading in a post becomes an h2
  walkTokens(token) {
    if (token.type === 'heading' && (token as Tokens.Heading).depth === 1) (token as Tokens.Heading).depth = 2;
  },
  renderer: {
    // links to other sites open in a new tab
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//.test(href);
      return `<a href="${escapeAttr(href)}"${title ? ` title="${escapeAttr(title)}"` : ''}${external ? ' target="_blank" rel="noreferrer"' : ''}>${text}</a>`;
    },
    // pictures load as they scroll into view and never hold up the page
    image({ href, title, text }) {
      return `<img src="${escapeAttr(href)}" alt="${escapeAttr(text)}"${title ? ` title="${escapeAttr(title)}"` : ''} loading="lazy" decoding="async">`;
    },
  },
});

export function blogPages(root: string): Plugin {
  const dir = join(root, 'content', 'blog');
  let dev = false;
  const posts = () => readPosts(dir, { drafts: dev });
  const meta = ({ body: _body, ...rest }: Post) => rest;

  return {
    name: 'blog-pages',
    configResolved(config) {
      dev = config.command === 'serve';
    },
    resolveId(id) {
      if (id === LIST || id.startsWith(ONE)) return `\0${id}`;
    },
    async load(id) {
      if (id === `\0${LIST}`) {
        const list = await posts();
        const loaders = list.map((p) => `${JSON.stringify(p.slug)}: () => import(${JSON.stringify(ONE + p.slug)})`);
        return `export const posts = ${JSON.stringify(list.map(meta))};\nexport const loaders = {${loaders.join(',')}};`;
      }
      if (id.startsWith(`\0${ONE}`)) {
        const post = (await posts()).find((p) => p.slug === id.slice(ONE.length + 1));
        if (!post) return 'export default null;';
        return `export default ${JSON.stringify({ ...meta(post), html: await marked.parse(post.body) })};`;
      }
    },
    // writing a post in dev: reload the blog as soon as the file is saved
    configureServer(server) {
      server.watcher.add(dir);
      const refresh = (file: string) => {
        if (!file.replace(/\\/g, '/').includes('/content/blog/')) return;
        for (const m of server.moduleGraph.idToModuleMap.values()) {
          if (m.id?.startsWith(`\0${LIST}`) || m.id?.startsWith(`\0${ONE}`)) server.moduleGraph.invalidateModule(m);
        }
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', refresh);
      server.watcher.on('change', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}
