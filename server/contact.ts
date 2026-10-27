/**
 * POST /api/contact: validates a contact-form message and emails it via the Gmail API.
 * Shared by the Netlify function, the Docker Node server and the Vite dev server.
 *
 * Sending uses an OAuth refresh token with the narrow `gmail.send` scope (send only; it
 * can't read or delete mail). See docs/email-setup.md.
 */
import { Buffer } from 'node:buffer';
import { validateContact, type ContactInput, type ContactResponse } from '../src/shared/contact.ts';

export interface MailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  /** The Gmail address the token belongs to; mail is sent from it. */
  sender: string;
  /** Where messages land. Defaults to the sender. */
  to: string;
}

export function mailConfigFromEnv(env: Record<string, string | undefined>): MailConfig | null {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER, CONTACT_TO } = env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_SENDER) return null;
  return {
    clientId: GMAIL_CLIENT_ID.trim(),
    clientSecret: GMAIL_CLIENT_SECRET.trim(),
    refreshToken: GMAIL_REFRESH_TOKEN.trim(),
    sender: GMAIL_SENDER.trim(),
    to: (CONTACT_TO || GMAIL_SENDER).trim(),
  };
}

export interface ContactOptions {
  config: MailConfig | null;
  clientIp: string;
  /** No credentials in local dev: print the email instead of failing. */
  dryRun?: boolean;
}

export interface ContactResult {
  status: number;
  body: ContactResponse;
}

/** Bots fill hidden fields and submit instantly; humans take a few seconds. */
const MIN_FILL_MS = 3000;

// Best-effort flood protection. Per server instance (serverless instances each keep their own).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function rateLimited(ip: string, now: number): boolean {
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(ip, hits);
    return true;
  }
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear(); // don't let a scan grow this forever
  return false;
}

export async function handleContact(raw: unknown, opts: ContactOptions): Promise<ContactResult> {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const now = Date.now();

  // spam traps: pretend it worked so bots don't learn anything
  const startedAt = Number(obj.startedAt);
  if (obj.website || !Number.isFinite(startedAt) || now - startedAt < MIN_FILL_MS) {
    return { status: 200, body: { ok: true } };
  }

  const checked = validateContact(obj);
  if (!checked.ok) {
    return { status: 400, body: { ok: false, error: 'Please fix the highlighted fields.', fields: checked.fields } };
  }

  if (rateLimited(opts.clientIp, now)) {
    return { status: 429, body: { ok: false, error: "That's a lot of messages! Try again in a few minutes." } };
  }

  if (!opts.config) {
    if (opts.dryRun) {
      console.info('\n[contact] email not configured; this is what would be sent:\n', checked.value, '\n');
      return { status: 200, body: { ok: true } };
    }
    console.error('[contact] GMAIL_* environment variables are missing');
    return { status: 503, body: { ok: false, error: "The mailbox isn't set up yet. Please try again later." } };
  }

  try {
    await sendViaGmail(opts.config, checked.value);
    return { status: 200, body: { ok: true } };
  } catch (err) {
    console.error('[contact] send failed:', err instanceof Error ? err.message : err);
    return { status: 502, body: { ok: false, error: "Couldn't send right now. Please try again in a bit." } };
  }
}

// ---------- Gmail ----------

async function accessToken(c: MailConfig): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      refresh_token: c.refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`token refresh ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('token refresh returned no access_token');
  return data.access_token;
}

async function sendViaGmail(c: MailConfig, msg: ContactInput): Promise<void> {
  const token = await accessToken(c);
  const raw = Buffer.from(buildMime(c, msg)).toString('base64url');
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`gmail send ${res.status}: ${await res.text()}`);
}

/** RFC 2047 encoded-word, so names and subjects can hold any Unicode safely. */
const encodeWord = (s: string) => `=?UTF-8?B?${Buffer.from(s).toString('base64')}?=`;

function buildMime(c: MailConfig, msg: ContactInput): string {
  const body = [
    `Name:  ${msg.name}`,
    `Email: ${msg.email}`,
    '',
    msg.message,
    '',
    '-- sent from the contact form on your portfolio',
  ].join('\n');

  const headers = [
    `From: ${encodeWord('Portfolio contact form')} <${c.sender}>`,
    `To: <${c.to}>`,
    `Reply-To: ${encodeWord(msg.name)} <${msg.email}>`,
    `Subject: ${encodeWord(`Portfolio: message from ${msg.name}`)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  const encodedBody = Buffer.from(body).toString('base64').replace(/.{76}/g, '$&\r\n');
  return `${headers.join('\r\n')}\r\n\r\n${encodedBody}`;
}
