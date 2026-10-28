/**
 * Production server for the Docker image: serves the built site from dist/ and handles
 * POST /api/contact. Plain node:http, no dependencies. Node 24 runs this .ts file directly.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { handleContact, mailConfigFromEnv } from './contact.ts';

const DIST = resolve(process.env.DIST_DIR ?? 'dist');
const PORT = Number(process.env.PORT ?? 8080);
const MAX_BODY = 20_000;
const mailConfig = mailConfigFromEnv(process.env);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
};

function send(res: ServerResponse, status: number, body: string | Buffer, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'x-content-type-options': 'nosniff', ...headers });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<string> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new Error('too large');
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function contact(req: IncomingMessage, res: ServerResponse) {
  const json = (status: number, body: unknown) =>
    send(res, status, JSON.stringify(body), { 'content-type': 'application/json' });
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readBody(req));
  } catch {
    return json(400, { ok: false, error: 'Bad request' });
  }
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]?.trim();
  const result = await handleContact(parsed, {
    config: mailConfig,
    clientIp: forwarded || req.socket.remoteAddress || 'unknown',
  });
  return json(result.status, result.body);
}

/** The site is a single page, so any other address gets the crayon 404 page (with a real 404 status). */
async function notFound(req: IncomingMessage, res: ServerResponse) {
  try {
    const page = await readFile(join(DIST, '404.html'));
    send(res, 404, req.method === 'HEAD' ? '' : page, {
      'content-type': TYPES['.html']!,
      'cache-control': 'no-cache',
    });
  } catch {
    send(res, 404, 'Not found');
  }
}

async function staticFile(req: IncomingMessage, res: ServerResponse, pathname: string) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

  let file = resolve(join(DIST, decodeURIComponent(pathname)));
  if (file !== DIST && !file.startsWith(DIST + sep)) return send(res, 403, 'Forbidden');

  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    return notFound(req, res);
  }

  try {
    const data = await readFile(file);
    const hashed = pathname.startsWith('/assets/');
    send(res, 200, req.method === 'HEAD' ? '' : data, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
  } catch {
    return notFound(req, res);
  }
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const handler = pathname === '/api/contact' ? contact(req, res) : staticFile(req, res, pathname);
  handler.catch((err: unknown) => {
    console.error(err);
    if (!res.headersSent) send(res, 500, 'Server error');
  });
}).listen(PORT, () => {
  console.info(`portfolio on http://localhost:${PORT} (email ${mailConfig ? 'configured' : 'NOT configured'})`);
});
