/**
 * The sketchpad's AI mode, on the page's side (the server side is server/ask.ts). Loaded only when
 * "ask" is pressed, so the sketchpad itself stays as light as before.
 *
 * 1. Read: typed notes go as text. Handwriting is grouped (strokes close together are one group) and
 *    every new group goes into one picture, each in its own numbered box.
 * 2. Ask /api/ask, which says what each thing is, answers the questions and remarks, and reacts to
 *    drawings.
 * 3. Write each answer in crayon handwriting (answers.ts), in free space next to what it answers. If there's no room right next to
 *    it, the answer goes in the nearest free spot further out, with a crayon arrow pointing to it.
 *
 * Each answer notes the fingerprint of what it answers (the note's text, or the group's strokes), so
 * nothing with an answer on the sheet is asked again. Undo or rub out an answer and it can be asked
 * again; change a note and it's a new question. Things that got no answer (unreadable bits) are remembered for
 * the tab, so they aren't sent every time.
 */
import { doodleLines } from '../crayon/doodles.ts';
import { ASK_LIMITS, markRef, typedRef, type AnswerDoodle, type AskInput, type AskItem, type AskResponse, type AskTurn } from '../shared/ask.ts';
import { CRAYONS, pathD, type Stroke } from './brush.ts';
import { strokeBox, type Box } from './camera.ts';
import { ANSWER_WIDTH, answerSize, answerText, DOODLE_ROOM, DOODLE_SIZE, freshAnswers, wrapAnswer } from './answers.ts';
import { newNoteId, noteBox, noteMeasure, type Note } from './notes.ts';

// ---------- groups of handwriting ----------

/** Strokes closer than this (world units) are the same group: letters of a word, words of a line. */
const JOIN_GAP = 28;
/** Lines of writing closer than this are the same group too (a two-line question). */
const LINE_GAP = 36;

export interface Group {
  /** Fingerprint of the strokes, so a group is recognised as already answered. */
  key: string;
  box: Box;
  strokes: Stroke[];
}

const grow = (b: Box, dx: number, dy = dx): Box => ({ x0: b.x0 - dx, y0: b.y0 - dy, x1: b.x1 + dx, y1: b.y1 + dy });
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const union = (a: Box, b: Box): Box => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) });

/** The visitor's strokes (not the AI's arrows), grouped by how close they are. */
/**
 * Two words of one line: side by side, mostly level, and the gap between them no wider than about a
 * letter is tall (people space words by their writing size, which a fixed gap misses for big writing).
 */
function sameLine(a: Box, b: Box): boolean {
  const ha = a.y1 - a.y0;
  const hb = b.y1 - b.y0;
  const level = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0); // how much they share vertically
  if (level < 0.5 * Math.min(ha, hb)) return false;
  const gap = Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1);
  return gap <= Math.min(Math.max(ha, hb), 120);
}

export function groupStrokes(strokes: Stroke[]): Group[] {
  const own = strokes.filter((s) => !s.a);
  const boxes = own.map(strokeBox);
  // union-find over strokes whose (slightly grown) boxes touch
  const parent = own.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  // a dot reaches twice as far, so a question mark's dot set a little apart stays with its question
  // (on its own, a lone dot would be read as a little drawing)
  const reach = own.map((s) => (spread(s) <= 14 ? 2 : 1));
  for (let i = 0; i < own.length; i++) {
    const a = grow(boxes[i]!, (JOIN_GAP / 2) * reach[i]!, (LINE_GAP / 2) * reach[i]!);
    for (let j = i + 1; j < own.length; j++) {
      if (overlaps(a, grow(boxes[j]!, (JOIN_GAP / 2) * reach[j]!, (LINE_GAP / 2) * reach[j]!)) || sameLine(boxes[i]!, boxes[j]!)) parent[find(i)] = find(j);
    }
  }
  const groups = new Map<number, Group>();
  own.forEach((s, i) => {
    const root = find(i);
    const g = groups.get(root);
    if (g) {
      g.strokes.push(s);
      g.box = union(g.box, boxes[i]!);
    } else groups.set(root, { key: '', box: boxes[i]!, strokes: [s] });
  });
  return [...groups.values()].map((g) => ({ ...g, key: `g${fingerprint(g.strokes.map((s) => s.p.join(',')).join('|'))}` }));
}

/** A short, stable hash (FNV-1a) of some text. */
function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

const noteKey = (n: Note) => `n${n.id}:${fingerprint(n.t)}`;
/** One stroke's fingerprint: an answer notes the strokes it read, so they're never read as new again. */
const strokeId = (s: Stroke) => `s${fingerprint(s.p.join(','))}`;

// ---------- what's already been dealt with ----------

const NO_ANSWER = 'scribbles-sketchpad-no-answer';

/** Things read before that got no answer (unreadable bits). */
function noAnswer(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(NO_ANSWER) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function rememberNoAnswer(keys: string[]) {
  if (!keys.length) return;
  try {
    sessionStorage.setItem(NO_ANSWER, JSON.stringify([...noAnswer(), ...keys].slice(-500)));
  } catch {
    // storage blocked: they may be read again after a reload
  }
}

// ---------- the picture of the handwriting ----------

/**
 * Each group is drawn this wide at most (and never bigger than 2x), one under another, with its number.
 * Wide enough that a long line of handwriting keeps letters a model can read (at 520 they shrank to ~14px).
 */
const TILE_W = 900;
const TILE_MAX_H = 360;
const PAD = 14;
const LABEL_W = 46;
/** Line width in the picture, whatever the crayon: thin enough that thick crayon letters don't blot. */
const LINE_MIN = 2.5;
const LINE_MAX = 5;
/** A dot (of a ?, !, i or full stop) is drawn as a round dot this wide in the picture. */
const DOT_W = 9;

/** How far a stroke's points spread (without the crayon's width). */
function spread(s: Stroke): number {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < s.p.length; i += 2) {
    x0 = Math.min(x0, s.p[i]!);
    x1 = Math.max(x1, s.p[i]!);
    y0 = Math.min(y0, s.p[i + 1]!);
    y1 = Math.max(y1, s.p[i + 1]!);
  }
  return Math.max(x1 - x0, y1 - y0);
}

/**
 * The strokes of a group that are dots: tiny next to the group's other strokes. People dot with a quick
 * flick, and drawn as it is, the flick under a question mark's hook looked like an arrow head to the AI.
 */
function dotsOf(strokes: Stroke[]): Set<Stroke> {
  const sizes = strokes.map(spread);
  const sorted = [...sizes].sort((a, b) => a - b);
  const typical = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const limit = Math.min(14, Math.max(5, typical * 0.3));
  return new Set(strokes.length > 1 ? strokes.filter((_, i) => sizes[i]! <= limit) : []);
}

/** A stroke in the picture: a line, or for a dot, a round dot where it was. */
function strokeSvg(s: Stroke, scale: number, dot: boolean, old: boolean): string {
  const ink = old ? ' stroke="#b4b4b4"' : '';
  if (dot) {
    let x = 0, y = 0;
    for (let i = 0; i < s.p.length; i += 2) (x += s.p[i]!), (y += s.p[i + 1]!);
    const n = s.p.length / 2;
    return `<circle cx="${x / n}" cy="${y / n}" r="${DOT_W / 2 / scale}" fill="${old ? '#b4b4b4' : '#111'}" stroke="none"/>`;
  }
  return `<path${ink} d="${pathD(s.p)}" stroke-width="${Math.min(LINE_MAX, Math.max(LINE_MIN, s.s * scale)) / scale}"/>`;
}

/** One picture of the groups, each in a numbered box, as a JPEG data URL. Black on white reads best. */
async function picture(groups: Group[], read: Set<string>): Promise<string> {
  const tiles = groups.map((g) => {
    const w = g.box.x1 - g.box.x0;
    const h = g.box.y1 - g.box.y0;
    const scale = Math.min(2, TILE_W / w, TILE_MAX_H / h);
    return { g, scale, w: w * scale, h: h * scale };
  });
  const width = LABEL_W + TILE_W + PAD * 3;
  let y = PAD;
  const parts: string[] = [];
  tiles.forEach((t, i) => {
    const top = y;
    const boxH = t.h + PAD * 2;
    parts.push(
      `<rect x="${LABEL_W}" y="${top}" width="${t.w + PAD * 2}" height="${boxH}" fill="none" stroke="#d6453d" stroke-width="3" rx="6"/>`,
      `<text x="${LABEL_W / 2}" y="${top + boxH / 2 + 10}" font-size="28" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="#d6453d">${i + 1}</text>`,
      `<g transform="translate(${LABEL_W + PAD} ${top + PAD}) scale(${t.scale}) translate(${-t.g.box.x0} ${-t.g.box.y0})" fill="none" stroke="#111" stroke-linecap="round" stroke-linejoin="round">`,
      // strokes already answered in grey, so a loop drawn round an old question shows as just a loop
      ...((dots) => t.g.strokes.map((s) => strokeSvg(s, t.scale, dots.has(s), read.has(strokeId(s)))))(dotsOf(t.g.strokes)),
      '</g>',
    );
    y += boxH + PAD;
  });
  const height = y;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#fff"/>${parts.join('')}</svg>`;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.85);
}

// ---------- finding space ----------

/** The gap kept between an answer and any other writing. */
const GAP = 18;

/** Where a box of size w × h can go near `target` without touching anything in `taken`. */
export function findSpot(target: Box, w: number, h: number, taken: Box[], below = false): { x: number; y: number; near: boolean } {
  const free = (x: number, y: number) => {
    const b = grow({ x0: x, y0: y, x1: x + w, y1: y + h }, GAP);
    return !taken.some((t) => overlaps(b, t));
  };
  // right next to it first: to the right, below, to the left, above (each tried at a few offsets)
  const midY = (target.y0 + target.y1) / 2 - h / 2;
  const beside: [number, number][] = [
    [target.x1 + GAP * 1.5, target.y0],
    [target.x1 + GAP * 1.5, midY],
  ];
  const under: [number, number][] = [
    [target.x0, target.y1 + GAP],
    [target.x0 - w / 3, target.y1 + GAP],
  ];
  // (on a narrow screen, under the question first: beside it would need zooming out to read)
  const nearby: [number, number][] = [
    ...(below ? [...under, ...beside] : [...beside, ...under]),
    [target.x0 - w - GAP * 1.5, target.y0],
    [target.x0, target.y0 - h - GAP],
  ];
  for (const [x, y] of nearby) if (free(x, y)) return { x, y, near: true };

  // nothing next to it: rings further and further out, nearest free spot wins
  const cx = (target.x0 + target.x1) / 2;
  const cy = (target.y0 + target.y1) / 2;
  const step = 40;
  for (let r = step; r < 6000; r += step) {
    let best: { x: number; y: number; d: number } | null = null;
    const n = Math.ceil((2 * Math.PI * r) / step);
    for (let k = 0; k < n; k++) {
      const angle = (k / n) * Math.PI * 2;
      const x = cx + Math.cos(angle) * r - w / 2;
      const y = cy + Math.sin(angle) * r - h / 2;
      if (!free(x, y)) continue;
      // prefer to the right and below, the way people read
      const d = r + (Math.cos(angle) < 0 ? step / 2 : 0) + (Math.sin(angle) < 0 ? step / 4 : 0);
      if (!best || d < best.d) best = { x, y, d };
    }
    if (best) return { x: Math.round(best.x), y: Math.round(best.y), near: false };
  }
  return { x: target.x1 + GAP, y: target.y1 + GAP, near: false }; // (a sheet this full is unlikely)
}

// ---------- arrows ----------

/** The point on a box's edge facing `toward`. */
function edgePoint(b: Box, toward: { x: number; y: number }) {
  const cx = (b.x0 + b.x1) / 2;
  const cy = (b.y0 + b.y1) / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  const sx = dx ? (b.x1 - b.x0) / 2 / Math.abs(dx) : Infinity;
  const sy = dy ? (b.y1 - b.y0) / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s };
}

/** A gently curved crayon arrow from box `from` to box `to`: the line and the two strokes of its head. */
export function arrow(from: Box, to: Box, colour: string): Stroke[] {
  const centre = (b: Box) => ({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 });
  const a0 = edgePoint(grow(from, 8), centre(to));
  const b0 = edgePoint(grow(to, 10), centre(from));
  const dx = b0.x - a0.x;
  const dy = b0.y - a0.y;
  const len = Math.hypot(dx, dy) || 1;
  // bend it a little to one side, like a hand would
  const bend = Math.min(60, len * 0.18);
  const ctrl = { x: (a0.x + b0.x) / 2 - (dy / len) * bend, y: (a0.y + b0.y) / 2 + (dx / len) * bend };
  const p: number[] = [];
  const steps = Math.max(8, Math.round(len / 18));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) ** 2 * a0.x + 2 * (1 - t) * t * ctrl.x + t ** 2 * b0.x;
    const y = (1 - t) ** 2 * a0.y + 2 * (1 - t) * t * ctrl.y + t ** 2 * b0.y;
    p.push(Math.round(x), Math.round(y));
  }
  // the head points along the end of the curve
  const hx = b0.x - ctrl.x;
  const hy = b0.y - ctrl.y;
  const hl = Math.hypot(hx, hy) || 1;
  const ux = hx / hl;
  const uy = hy / hl;
  const head = (side: number) => [
    Math.round(b0.x),
    Math.round(b0.y),
    Math.round(b0.x - ux * 16 + -uy * 10 * side),
    Math.round(b0.y - uy * 16 + ux * 10 * side),
  ];
  return [
    { c: colour, s: 4, p, a: 1 },
    { c: colour, s: 4, p: head(1), a: 1 },
    { c: colour, s: 4, p: head(-1), a: 1 },
  ];
}

// ---------- doodles beside answers ----------

const crayon = (name: (typeof CRAYONS)[number]['name']) => CRAYONS.find((c) => c.name === name)!.value;
/** The crayon each doodle is drawn in (the answer's own colour for the rest). */
const DOODLE_COLOURS: Partial<Record<AnswerDoodle, string>> = {
  heart: crayon('red'),
  sun: crayon('orange'),
  crown: crayon('yellow'),
  bulb: crayon('yellow'),
  bolt: crayon('yellow'),
  check: crayon('green'),
  flower: crayon('pink'),
  rocket: crayon('blue'),
};

/** The doodle as AI strokes, DOODLE_SIZE across at most, its top-left corner at (x, y). */
export function doodleStrokes(name: AnswerDoodle, x: number, y: number, colour: string): Stroke[] {
  const lines = doodleLines(name, Math.floor(Math.random() * 1e9));
  const all = lines.flat();
  if (!all.length) return [];
  const x0 = Math.min(...all.map((q) => q.x));
  const y0 = Math.min(...all.map((q) => q.y));
  const span = Math.max(Math.max(...all.map((q) => q.x)) - x0, Math.max(...all.map((q) => q.y)) - y0) || 1;
  const k = DOODLE_SIZE / span;
  const c = DOODLE_COLOURS[name] ?? colour;
  return lines
    .filter((l) => l.length > 1)
    .map((l) => ({ c, s: 4, p: l.flatMap((q) => [Math.round(x + (q.x - x0) * k), Math.round(y + (q.y - y0) * k)]), a: 1 as const }));
}

// ---------- the whole thing ----------

export type AskOutcome =
  | { ok: true; strokes: Stroke[]; notes: Note[]; read: number; skipped: number; repeats: number; focus: Box | null }
  | { ok: false; message: string };

/** What goes to the server, and where each thing sits on the sheet. */
interface Pending {
  input: AskInput;
  /** `strokes`: the fingerprints of a box's strokes (none for a typed note). */
  targets: Map<string, { box: Box; key: string; strokes: string[] }>;
}

/** Everything new on the sheet, ready to send (at most ASK_LIMITS.items things, oldest first). */
async function collect(strokes: Stroke[], notes: Note[]): Promise<Pending | null> {
  // answered (an AI answer for it is on the sheet), or read before and needing no answer
  const done = new Set([...noAnswer(), ...notes.flatMap((n) => (n.ai ? [n.ai.for] : []))]);
  // strokes already read: a group with nothing else (two answered questions now touching) isn't sent
  const read = new Set([...done, ...notes.flatMap((n) => n.ai?.read ?? [])]);
  const targets: Pending['targets'] = new Map();
  const typed = notes
    .filter((n) => !n.ai && n.t.trim() && !done.has(noteKey(n)))
    .slice(0, ASK_LIMITS.items)
    .map((n) => {
      targets.set(typedRef(n.id), { box: noteBox(n), key: noteKey(n), strokes: [] });
      return { id: n.id, text: n.t.trim().slice(0, ASK_LIMITS.text) };
    });
  const groups = groupStrokes(strokes)
    .filter((g) => !done.has(g.key) && g.strokes.some((s) => !read.has(strokeId(s))))
    .slice(0, Math.max(0, Math.min(12, ASK_LIMITS.items - typed.length)));
  groups.forEach((g, i) => targets.set(markRef(i + 1), { box: g.box, key: g.key, strokes: g.strokes.map(strokeId) }));
  if (!typed.length && !groups.length) return null;
  // the last few questions answered on the sheet, so a follow-up ("what about the other one?") makes sense
  const history: AskTurn[] = notes
    .flatMap((n) => (n.ai?.q ? [{ q: n.ai.q, a: n.t.replace(/\s+/g, ' ') }] : []))
    .slice(-ASK_LIMITS.history);
  return {
    input: {
      typed,
      marks: groups.map((_, i) => i + 1),
      ...(groups.length ? { image: await picture(groups, read) } : {}),
      ...(history.length ? { history } : {}),
    },
    targets,
  };
}

/**
 * Read the sheet, ask, and work out where the answers go. Returns the new notes and arrows (the caller
 * adds them as one undo step) and a box to bring into view.
 */
export async function askSheet(
  strokes: Stroke[],
  notes: Note[],
  colour: string,
  /** Told where on the sheet the things being read are, once they're known (for the "reading" doodle). */
  onReading?: (box: Box) => void,
  /** How much of the sheet is in view, in world units: answers on a narrow screen are wrapped to fit it. */
  viewWidth = Infinity,
): Promise<AskOutcome> {
  // a narrow view (a phone) gets narrower answers, written under the question
  const narrow = viewWidth < ANSWER_WIDTH * 1.6;
  const wrapWidth = Math.max(200, Math.min(ANSWER_WIDTH, viewWidth - 40));
  const pending = await collect(strokes, notes);
  if (!pending) return { ok: false, message: 'Nothing new to read. Write or type a question first!' };
  onReading?.([...pending.targets.values()].map((t) => t.box).reduce(union));

  let reply: AskResponse;
  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pending.input),
    });
    reply = (await res.json()) as AskResponse;
  } catch {
    return { ok: false, message: "I couldn't reach the AI. Check your connection and try again." };
  }
  if (!reply.ok) return { ok: false, message: reply.error };

  // everything already on the sheet is taken space; each answer placed takes its space too
  const taken = [...strokes.map(strokeBox), ...notes.map(noteBox)];
  const newStrokes: Stroke[] = [];
  const newNotes: Note[] = [];
  const unanswered: string[] = [];
  let focus: Box | null = null;
  let skipped = 0;
  let repeats = 0;
  for (const item of reply.items as AskItem[]) {
    const target = pending.targets.get(item.ref);
    if (!target) continue;
    if (item.kind === 'repeat') repeats++;
    if (!item.answer) {
      unanswered.push(target.key, ...target.strokes);
      skipped++;
      continue;
    }
    const t = wrapAnswer(answerText(item.answer), wrapWidth);
    if (!t) {
      unanswered.push(target.key, ...target.strokes);
      skipped++;
      continue;
    }
    const q = item.text.slice(0, ASK_LIMITS.historyText);
    const draft: Note = { id: newNoteId(), x: 0, y: 0, t, c: colour, s: 0, ai: { for: target.key, ...(q ? { q } : {}), ...(target.strokes.length ? { read: target.strokes } : {}), ...(item.link ? { link: item.link } : {}) } };
    const { w, h } = noteMeasure(draft);
    // a doodle goes to the right of the answer's first line: keep room for it
    const spot = findSpot(target.box, w + (item.doodle ? DOODLE_ROOM : 0), h, taken, narrow);
    const note: Note = { ...draft, x: Math.round(spot.x), y: Math.round(spot.y) };
    freshAnswers.add(note.id); // so it writes itself in
    let box = noteBox(note);
    if (item.doodle) {
      const doodle = doodleStrokes(item.doodle, note.x + answerSize(note).w + 14, note.y, colour);
      newStrokes.push(...doodle);
      box = doodle.map(strokeBox).reduce(union, box);
    }
    taken.push(grow(box, 4));
    newNotes.push(note);
    if (!spot.near) {
      const lines = arrow(target.box, box, colour);
      newStrokes.push(...lines);
      taken.push(...lines.map(strokeBox));
    }
    focus = focus ? union(focus, union(box, target.box)) : union(box, target.box);
  }
  rememberNoAnswer(unanswered);
  return { ok: true, strokes: newStrokes, notes: newNotes, read: reply.items.length, skipped, repeats, focus };
}

