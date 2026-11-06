/**
 * A small key-value store for the AI endpoint: the answer cache, the rate limit and the question log.
 *
 * On Netlify it's Netlify Blobs (free, shared by every function instance, kept between deploys). In
 * Docker and local dev it's memory, which is fine for one long-running server.
 *
 * Every call is best-effort: a slow or failing store never stops a question being answered, it just
 * means no cache hit, no rate-limit record or no log line that time.
 */
import { createHash } from 'node:crypto';

export interface AskStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  /** Keys starting with `prefix`. */
  list(prefix: string): Promise<string[]>;
}

/** How long a store call may take before it's given up on. */
const STORE_MS = 1_500;

const timeout = <T>(p: Promise<T>, fallback: T): Promise<T> =>
  Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), STORE_MS))]).catch((err: unknown) => {
    console.error('[store]', err instanceof Error ? err.message : err);
    return fallback;
  });

/** Kept in this process only. Drops everything past `max` keys, oldest first. */
export function memoryStore(max = 5_000): AskStore {
  const data = new Map<string, string>();
  return {
    get: async <T>(key: string) => {
      const v = data.get(key);
      return v === undefined ? null : (JSON.parse(v) as T);
    },
    set: async (key, value) => {
      data.delete(key);
      data.set(key, JSON.stringify(value));
      if (data.size > max) data.delete(data.keys().next().value!);
    },
    list: async (prefix) => [...data.keys()].filter((k) => k.startsWith(prefix)),
  };
}

/** Netlify Blobs, for the Netlify functions (loaded only there, so Docker and dev don't need it). */
export function blobStore(name: string): AskStore {
  const store = import('@netlify/blobs').then(({ getStore }) => getStore({ name, consistency: 'strong' }));
  return {
    get: <T>(key: string) => timeout(store.then((s) => s.get(key, { type: 'json' }) as Promise<T | null>), null),
    set: (key, value) => timeout(store.then((s) => s.setJSON(key, value).then(() => undefined)), undefined),
    list: (prefix) => timeout(store.then(async (s) => (await s.list({ prefix })).blobs.map((b) => b.key)), []),
  };
}

/** A short, stable hash of some text (for keys: no visitor's IP or question is kept as a key). */
export const hashOf = (text: string) => createHash('sha256').update(text).digest('base64url').slice(0, 22);

/** The one memory store for this process (Docker and the dev server), shared by /api/ask and /api/ask-log. */
export const localStore = memoryStore();
