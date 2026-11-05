/**
 * How the AI's answers look on the sketchpad: written in the site's crayon handwriting (the same engine as
 * the headings), not typed. An answer is still a note in the data (notes.ts, with `ai` set); this works out
 * its handwriting, which is also what its size on the sheet is measured from, so placing, dragging and
 * erasing match what's drawn.
 */
import { glyphs } from '../crayon/font/hersheySans.ts';
import { planHandwriting } from '../crayon/handwriting.ts';
import { CAP, type CrayonPlan } from '../crayon/strokes.ts';

/** Height of a capital letter in an answer, in world units. */
export const ANSWER_CAP = 22;
/** How wide an answer is wrapped, in world units. */
export const ANSWER_WIDTH = 440;
/** However long the answer, it's written within about this long. */
const WRITE_MS = 2200;
/** A tidy hand (answers should be easy to read), heavier than the headings: under the sheet's grain, thin lines fade. */
const HAND = { messiness: 0.6, speed: 1, weight: 0.16 };

const k = ANSWER_CAP / CAP;

/**
 * Answers the crayon font can write: plain ASCII. Accents are dropped (é → e), curly quotes and dashes
 * straightened, and anything else the font has no letter for (emoji, other scripts) left out.
 */
export function answerText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .split('')
    .filter((c) => c === ' ' || c === '\n' || c in glyphs)
    .join('')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** About how wide a line comes out, in world units (the handwriting's spacing without its wobble). */
function lineWidth(line: string): number {
  let x = 0;
  for (const c of line) {
    const g = glyphs[c];
    x += g ? g.w * CAP + (g.w < 0.2 ? 0.08 * CAP : 0) + 0.22 * CAP : 0.6 * CAP;
  }
  return x * k;
}

/** Greedy word wrap to ANSWER_WIDTH. */
export function wrapAnswer(text: string): string {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ').filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (line && lineWidth(next) > ANSWER_WIDTH) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/** A note id to a seed, so the same answer is always written in the same hand. */
function seedOf(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export interface AnswerHand {
  plan: CrayonPlan;
  /** World units per plan unit. */
  scale: number;
  seed: number;
}

const cache = new Map<string, AnswerHand>();

/** The handwriting for an answer (worked out once per answer). */
export function answerHand(note: { id: string; t: string }): AnswerHand {
  const key = `${note.id}|${note.t}`;
  let hand = cache.get(key);
  if (hand) return hand;
  const seed = seedOf(note.id);
  const plan = planHandwriting(note.t, { seed, ...HAND, pxPerUnit: k, exactSize: true });
  // squeeze the timing so a long answer doesn't take half a minute to write
  const speedUp = Math.max(3, plan.totalDuration / WRITE_MS);
  for (const s of plan.strokes) {
    s.delay /= speedUp;
    s.duration = Math.max(20, s.duration / speedUp);
  }
  plan.totalDuration /= speedUp;
  hand = { plan, scale: k, seed };
  if (cache.size > 200) cache.clear();
  cache.set(key, hand);
  return hand;
}

/** An answer's size on the sheet, in world units. */
export function answerSize(note: { id: string; t: string }) {
  const { plan, scale } = answerHand(note);
  return { w: plan.width * scale, h: plan.height * scale };
}

/** Answers placed during this visit, which write themselves in; ones already on the sheet just show. */
export const freshAnswers = new Set<string>();
