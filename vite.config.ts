import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { askConfigFromEnv, handleAsk } from './server/ask.ts';
import { handleAskLog } from './server/ask-log.ts';
import { localStore } from './server/store.ts';
import { handleContact, mailConfigFromEnv } from './server/contact.ts';
import { blogPages } from './server/vite-blog.ts';

type Handler = (body: unknown, clientIp: string) => Promise<{ status: number; body: unknown }>;

/** A POST JSON endpoint for the dev and preview servers, at most `maxBytes` of body. */
function postJson(handle: Handler, maxBytes: number): Connect.NextHandleFunction {
  return (req: IncomingMessage, res: ServerResponse) => {
    const reply = (status: number, body: unknown) => {
      res.statusCode = status;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'POST') return reply(405, { ok: false, error: 'Method not allowed' });

    let raw = '';
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size <= maxBytes) raw += chunk.toString('utf8');
    });
    req.on('end', async () => {
      if (size > maxBytes) return reply(413, { ok: false, error: 'Too large' });
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        return reply(400, { ok: false, error: 'Bad request' });
      }
      const result = await handle(body, req.socket.remoteAddress ?? 'local');
      reply(result.status, result.body);
    });
  };
}

/**
 * Serves POST /api/contact and /api/ask during `npm run dev` / `npm run preview`, using the same
 * handlers as production. Without GMAIL_* values in .env.local the contact form prints the email to the
 * terminal; without AI keys the sketchpad gets practice answers.
 */
function api(env: Record<string, string>): Plugin {
  const contact = postJson((body, clientIp) => handleContact(body, { config: mailConfigFromEnv(env), clientIp, dryRun: true }), 20_000);
  // AI_PRACTICE=1 (in .env.local or the shell) ignores the AI keys and gives practice answers, for trying the sketchpad
  const askConfig = env.AI_PRACTICE === '1' ? {} : askConfigFromEnv(env);
  const ask = postJson((body, clientIp) => handleAsk(body, { config: askConfig, clientIp, dryRun: true }), 2_000_000);
  const askLog: Connect.NextHandleFunction = async (req, res) => {
    const days = new URL(req.originalUrl ?? req.url ?? '/', 'http://localhost').searchParams.get('days');
    const result = await handleAskLog(localStore, { key: env.ASK_LOG_KEY, auth: req.headers.authorization, days });
    res.statusCode = result.status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(result.body));
  };
  const use = (server: { middlewares: Connect.Server }) => {
    server.middlewares.use('/api/contact', contact);
    server.middlewares.use('/api/ask-log', askLog);
    server.middlewares.use('/api/ask', ask);
  };
  return { name: 'api', configureServer: use, configurePreviewServer: use };
}

/**
 * `/draw` opens the sketchpad (draw.html), and `/blog` and `/blog/<post>` the blog (blog.html), in dev
 * and preview, the way Netlify serves them live.
 */
function prettyUrls(): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    const [path = '', query] = (req.url ?? '').split('?');
    const page = path === '/draw' ? '/draw.html' : path === '/blog' || path.startsWith('/blog/') ? '/blog.html' : null;
    if (page) req.url = query === undefined ? page : `${page}?${query}`;
    next();
  };
  return {
    name: 'pretty-urls',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), api(loadEnv(mode, process.cwd(), '')), prettyUrls(), blogPages(process.cwd())],
  build: {
    rolldownOptions: {
      // the site, plus the crayon page shown for addresses that don't exist (Netlify serves dist/404.html)
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        notFound: fileURLToPath(new URL('./404.html', import.meta.url)),
        sketchpad: fileURLToPath(new URL('./draw.html', import.meta.url)),
        blog: fileURLToPath(new URL('./blog.html', import.meta.url)),
      },
    },
  },
}));
