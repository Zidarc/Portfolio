import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { askConfigFromEnv, handleAsk } from './server/ask.ts';
import { handleContact, mailConfigFromEnv } from './server/contact.ts';

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
  const ask = postJson((body, clientIp) => handleAsk(body, { config: askConfigFromEnv(env), clientIp, dryRun: true }), 2_000_000);
  const use = (server: { middlewares: Connect.Server }) => {
    server.middlewares.use('/api/contact', contact);
    server.middlewares.use('/api/ask', ask);
  };
  return { name: 'api', configureServer: use, configurePreviewServer: use };
}

/** `/draw` opens the sketchpad (draw.html) in dev and preview, the way Netlify serves it live. */
function prettyDrawUrl(): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    if (req.url === '/draw' || req.url?.startsWith('/draw?')) req.url = req.url.replace('/draw', '/draw.html');
    next();
  };
  return {
    name: 'pretty-draw-url',
    configureServer: (server) => void server.middlewares.use(rewrite),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), api(loadEnv(mode, process.cwd(), '')), prettyDrawUrl()],
  build: {
    rolldownOptions: {
      // the site, plus the crayon page shown for addresses that don't exist (Netlify serves dist/404.html)
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        notFound: fileURLToPath(new URL('./404.html', import.meta.url)),
        sketchpad: fileURLToPath(new URL('./draw.html', import.meta.url)),
      },
    },
  },
}));
