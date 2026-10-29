import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { handleContact, mailConfigFromEnv } from './server/contact.ts';

/**
 * Serves POST /api/contact during `npm run dev` / `npm run preview`, using the same handler
 * as production. Without GMAIL_* values in .env.local it prints the email to the terminal.
 */
function contactApi(env: Record<string, string>): Plugin {
  const middleware: Connect.NextHandleFunction = (req: IncomingMessage, res: ServerResponse) => {
    const reply = (status: number, body: unknown) => {
      res.statusCode = status;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'POST') return reply(405, { ok: false, error: 'Method not allowed' });

    let raw = '';
    req.on('data', (chunk: Buffer) => (raw += chunk.toString('utf8')));
    req.on('end', async () => {
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        return reply(400, { ok: false, error: 'Bad request' });
      }
      const result = await handleContact(body, {
        config: mailConfigFromEnv(env),
        clientIp: req.socket.remoteAddress ?? 'local',
        dryRun: true,
      });
      reply(result.status, result.body);
    });
  };

  return {
    name: 'contact-api',
    configureServer: (server) => void server.middlewares.use('/api/contact', middleware),
    configurePreviewServer: (server) => void server.middlewares.use('/api/contact', middleware),
  };
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
  plugins: [react(), contactApi(loadEnv(mode, process.cwd(), '')), prettyDrawUrl()],
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
