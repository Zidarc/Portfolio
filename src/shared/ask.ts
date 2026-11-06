/**
 * POST /api/ask: the sketchpad's AI mode. Shared by the sketchpad (to build a request and read the
 * reply) and the server (the real check).
 *
 * One request carries everything new on the sheet that might be worth answering:
 * - `typed`: typed notes, sent as text (nothing to read)
 * - `image` + `marks`: one picture of the handwriting, with a numbered box drawn round each group of
 *   strokes; `marks` lists those numbers
 *
 * The reply has one item per thing sent, tagged with the same ref: "t:<note id>" for a note and
 * "m<number>" for a numbered box. Drawings and anything unreadable come back without an answer.
 */

export type AskKind = 'question' | 'statement' | 'drawing' | 'unclear';

export interface AskTyped {
  id: string;
  text: string;
}

/** A question already answered on the sheet, and its answer: so "what about the other one?" makes sense. */
export interface AskTurn {
  q: string;
  a: string;
}

export interface AskInput {
  typed: AskTyped[];
  /** A PNG/JPEG/WebP data URL of the handwriting, with the numbered boxes drawn on. */
  image?: string;
  marks: number[];
  /** The last few questions answered on this sheet, oldest first (at most ASK_LIMITS.history). */
  history?: AskTurn[];
}

export interface AskItem {
  ref: string;
  kind: AskKind;
  /** What it says (the AI's reading of handwriting; the text itself for typed notes). */
  text: string;
  /** Only for questions and statements. */
  answer?: string;
}

export type AskErrorCode = 'bad-request' | 'too-many' | 'out-of-crayons' | 'not-set-up' | 'snapped';

export type AskResponse =
  | { ok: true; items: AskItem[]; provider: string }
  | { ok: false; code: AskErrorCode; error: string };

export const ASK_LIMITS = {
  items: 30,
  text: 600,
  /** Characters in the image data URL (about 1.1 MB of image). */
  image: 1_500_000,
  answer: 900,
  history: 3,
  /** Characters of an earlier question sent as history. */
  historyText: 300,
} as const;

const NOTE_ID = /^[a-z0-9]{1,16}$/;
const IMAGE = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i;

export const typedRef = (id: string) => `t:${id}`;
export const markRef = (n: number) => `m${n}`;

/** Check a request. Returns the cleaned input, or what's wrong with it. */
export function validateAsk(raw: unknown): { ok: true; value: AskInput } | { ok: false; error: string } {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const typedRaw = Array.isArray(obj.typed) ? obj.typed : [];
  const marksRaw = Array.isArray(obj.marks) ? obj.marks : [];

  const typed: AskTyped[] = [];
  for (const t of typedRaw) {
    const item = (typeof t === 'object' && t !== null ? t : {}) as Record<string, unknown>;
    const id = typeof item.id === 'string' ? item.id : '';
    const text = typeof item.text === 'string' ? item.text.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim() : '';
    if (!NOTE_ID.test(id) || !text) return { ok: false, error: 'A typed note is malformed.' };
    if (text.length > ASK_LIMITS.text) return { ok: false, error: `Keep each note under ${ASK_LIMITS.text} characters.` };
    typed.push({ id, text });
  }

  const marks = [...new Set(marksRaw)].filter((m): m is number => Number.isInteger(m) && m > 0 && m < 1000);
  if (marks.length !== marksRaw.length) return { ok: false, error: 'The numbered boxes are malformed.' };

  let image: string | undefined;
  if (marks.length) {
    if (typeof obj.image !== 'string' || !IMAGE.test(obj.image)) return { ok: false, error: 'The picture is missing or not an image.' };
    if (obj.image.length > ASK_LIMITS.image) return { ok: false, error: 'The picture is too big.' };
    image = obj.image;
  }

  // history is context only: anything malformed in it is dropped rather than refused
  const clean = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, n) : '');
  const history: AskTurn[] = (Array.isArray(obj.history) ? obj.history : []).slice(-ASK_LIMITS.history).flatMap((h) => {
    const item = (typeof h === 'object' && h !== null ? h : {}) as Record<string, unknown>;
    const q = clean(item.q, ASK_LIMITS.historyText);
    const a = clean(item.a, ASK_LIMITS.answer);
    return q && a ? [{ q, a }] : [];
  });

  if (!typed.length && !marks.length) return { ok: false, error: 'There is nothing to read.' };
  if (typed.length + marks.length > ASK_LIMITS.items) return { ok: false, error: 'Too much at once: ask about fewer things.' };
  return { ok: true, value: { typed, image, marks, ...(history.length ? { history } : {}) } };
}
