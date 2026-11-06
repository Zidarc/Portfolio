import { useEffect, useRef, useState } from 'react';
import { ThemeButton } from '../components/ThemeButton.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { useTheme, type Theme } from '../theme.ts';
import { chalkOf, crayonPasses, type Stroke } from './brush.ts';
import { drawingBox, MAX_ZOOM, MIN_ZOOM, useCamera, type Box } from './camera.ts';
import { useToolCursor } from './cursors.ts';
import { ScribbleSurface } from './ScribbleSurface.tsx';
import { Toolbar } from './Toolbar.tsx';
import { firstBaseline, LINE, newNoteId, NOTE_FONT, noteLines, noteMeasure, noteSize, type Note } from './notes.ts';
import { Starters } from './Starters.tsx';
import { Thinking } from './Thinking.tsx';
import { useScribbles } from './useScribbles.ts';
import './scribble.css';

/** The AI writes its answers in purple, so they stand out from the visitor's own writing. */
const ANSWER_COLOUR = '#7b52ab';

/** Saved images are at most this many pixels on their long side (a huge canvas is scaled down to fit). */
const MAX_IMAGE_PX = 4096;

/**
 * Turn the whole drawing (not just what's on screen) into a PNG and download it: crayon on paper, or
 * chalk on the blackboard at night. It's built from the strokes themselves, since the sheet on screen
 * skips the ones far off screen; only the paper-grain mask is borrowed from it. The image can't see the
 * page's CSS variables, so the colours are written in.
 */
async function saveImage(sheet: HTMLElement, strokes: Stroke[], notes: Note[], theme: Theme) {
  const night = theme === 'dark';
  const defs = sheet.querySelector('svg defs');
  const mask = sheet.querySelector('svg g[mask]')?.getAttribute('mask');
  const box = drawingBox(strokes, notes);
  if (!defs || !mask || !box) return;
  const pad = 24;
  const width = box.x1 - box.x0 + pad * 2;
  const height = box.y1 - box.y0 + pad * 2;
  const lines = strokes
    .map((s) => {
      const passes = crayonPasses(s).map((p) => `<path d="${p.d}" stroke-width="${p.width}" stroke-opacity="${p.opacity}"/>`);
      return `<g stroke="${night ? chalkOf(s.c) : s.c}">${passes.join('')}</g>`;
    })
    .join('');
  const escape = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const typed = notes.filter((n) => !n.ai);
  const texts = typed
    .map((n) => {
      const base = n.y + firstBaseline(n.s);
      const rows = noteLines(n.t).map((l, i) => `<tspan x="${n.x}" y="${base + i * n.s * LINE}">${escape(l) || ' '}</tspan>`);
      return `<text fill="${night ? chalkOf(n.c) : n.c}" font-size="${n.s}" style="white-space:pre">${rows.join('')}</text>`;
    })
    .join('');
  // the AI's crayon answers, copied as drawn on the sheet (every note is drawn, even off screen)
  const answers = notes
    .filter((n) => n.ai)
    .map((n) => {
      const drawn = sheet.querySelector(`[data-note="${n.id}"] > g`);
      return drawn ? new XMLSerializer().serializeToString(drawn) : '';
    })
    .join('')
    // colours as written values (the image can't see the page's CSS variables), chalk at night
    .replace(/var\(--crayon-\w+, (#[0-9a-f]{6})\)/g, (_, hex: string) => (night ? chalkOf(hex) : hex));
  // an image can't load the page's fonts, so typed text brings the handwriting font along inside it
  const font = typed.length ? await fontFace() : '';
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<style>${font} text { font-family: ${NOTE_FONT}; }</style>` +
    new XMLSerializer().serializeToString(defs) +
    `<g transform="translate(${pad - box.x0} ${pad - box.y0})">` +
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round" mask="${mask}">${lines}${answers}</g>${texts}</g></svg>`;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await img.decode();
  const scale = Math.min(2, MAX_IMAGE_PX / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = night ? '#1f2b26' : '#fbf7ee';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const link = document.createElement('a');
  link.download = night ? 'my-chalk-scribble.png' : 'my-crayon-scribble.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/** The handwriting font as an @font-face rule with the font file inlined. */
async function fontFace() {
  try {
    const blob = await (await fetch('/fonts/patrick-hand-latin.woff2')).blob();
    const url = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
    return `@font-face { font-family: 'Patrick Hand'; src: url(${url}) format('woff2'); }`;
  } catch {
    return ''; // offline: the image falls back to a similar font
  }
}

/** What the "ask" button says afterwards, for a few seconds. */
const MESSAGE_MS = 6000;

/**
 * The "ask" button: hands the sheet to the AI (scribble/ai.ts, loaded the first time it's pressed) and
 * adds its answers and arrows as one undo step, then brings them into view.
 */
function useAsk(sb: ReturnType<typeof useScribbles>, camera: ReturnType<typeof useCamera>) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** What's being read right now, on the sheet (where the "reading" doodle goes). */
  const [reading, setReading] = useState<Box | null>(null);
  // the answers arrive seconds later: add them to the sheet as it is then, so undo takes off just them
  const latest = useRef(sb);
  latest.current = sb;

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => clearTimeout(t);
  }, [message]);

  /** `extra`: a note just added to the sheet (a starter question), which this render can't see yet. */
  const ask = async (extra?: Note) => {
    setBusy(true);
    setMessage(null);
    try {
      const { askSheet } = await import('./ai.ts');
      const notes = extra ? [...sb.notes, extra] : sb.notes;
      const out = await askSheet(sb.strokes, notes, ANSWER_COLOUR, setReading, camera.size.current.width / camera.current().z);
      if (!out.ok) return setMessage(out.message);
      if (out.notes.length) {
        latest.current.addMany({ strokes: out.strokes, notes: out.notes });
        if (out.focus) camera.show(out.focus);
      }
      const answeredCount = out.notes.length;
      setMessage(
        answeredCount
          ? `Answered ${answeredCount === 1 ? 'one thing' : `${answeredCount} things`}. AI answers can be wrong; it only knows Ali's CV, projects and blog.`
          : "I read it, but didn't find a question or remark to answer (drawings get no answer yet).",
      );
    } catch {
      setMessage('Something went wrong reading the sheet. Try again?');
    } finally {
      setBusy(false);
      setReading(null);
    }
  };

  return { busy, message, reading, ask };
}

/**
 * /draw: an endless sheet of paper to play with the crayons (a blackboard and chalk at night): move
 * around and zoom in and out. Kept until the tab is closed.
 */
export function Sketchpad() {
  const sb = useScribbles('scribbles-sketchpad');
  const camera = useCamera('scribbles-sketchpad-view');
  const sheetRef = useRef<HTMLDivElement>(null);
  const [hand, setHand] = useState(false);
  const theme = useTheme();
  const ai = useAsk(sb, camera);
  // (the text tool's cursor is only over the sheet, not the whole page)
  useToolCursor(sb, !hand && sb.tool !== 'text');

  // picking a crayon or the eraser puts the hand down
  useEffect(() => setHand(false), [sb.tool, sb.colour]);

  // + and - zoom, 0 shows everything
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest('input, textarea')) return;
      if (e.key === '+' || e.key === '=') camera.zoomBy(1.25);
      else if (e.key === '-') camera.zoomBy(0.8);
      else if (e.key === '0') camera.fit(sb.strokes, sb.notes);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const view = camera.current();
  const zoom = view.z;
  const empty = !sb.strokes.length && !sb.notes.length;

  /** A starter question: written on the sheet, a little above the middle of the view, and asked. */
  const askStarter = (question: string) => {
    const { width, height } = camera.size.current;
    const view = camera.current(); // (now: the sheet has measured itself since this render)
    const s = noteSize(sb.size);
    const { w } = noteMeasure({ t: question, s });
    const note: Note = {
      id: newNoteId(),
      // (on a phone, at the left edge: the answer goes under it and needs the whole width)
      x: Math.round(width / view.z < 700 ? view.x + 20 / view.z : view.x + width / 2 / view.z - w / 2),
      y: Math.round(view.y + (height * 0.3) / view.z),
      t: question,
      c: sb.colour,
      s,
    };
    sb.addMany({ notes: [note] });
    void ai.ask(note);
  };

  // the "reading" doodle goes just right of what's being read, kept on the sheet
  const thinkingAt = ai.reading && {
    left: Math.min(Math.max(8, (ai.reading.x1 - view.x) * view.z + 14), camera.size.current.width - 200),
    top: Math.min(Math.max(8, (ai.reading.y0 - view.y) * view.z), camera.size.current.height - 60),
  };

  return (
    <main className="sketchpad">
      <div className="sketchpad__top">
        <h1 className="sketchpad__title">
          <span className="sr-only">Sketchpad</span>
          <CrayonText text="Sketchpad" decorative capHeight={30} tempo={1.4} color="var(--crayon-blue)" />
        </h1>
        <div className="sketchpad__links">
          <a className="sketchpad__back" href="/">
            ← back to Ali's site
          </a>
          <ThemeButton className="sketchpad__theme" />
        </div>
      </div>
      <div ref={sheetRef} className="sketchpad__sheet">
        <ScribbleSurface sb={sb} active camera={camera} panning={hand} />
        {empty && !ai.busy && <Starters onPick={askStarter} />}
        {ai.busy && thinkingAt && <Thinking {...thinkingAt} />}
        <div className="sketchpad__view" role="toolbar" aria-label="Move and zoom">
          <button
            type="button"
            aria-pressed={hand}
            title="Move around (or hold space, drag with two fingers, or scroll)"
            onClick={() => setHand(!hand)}
          >
            <span aria-hidden="true">✋</span>
            <span className="sr-only">Move around</span>
          </button>
          <button type="button" title="Zoom out (-)" disabled={zoom <= MIN_ZOOM} onClick={() => camera.zoomBy(0.8)}>
            −<span className="sr-only">Zoom out</span>
          </button>
          <button type="button" className="sketchpad__zoom" title="Back to 100%" onClick={camera.actualSize}>
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" title="Zoom in (+)" disabled={zoom >= MAX_ZOOM} onClick={() => camera.zoomBy(1.25)}>
            +<span className="sr-only">Zoom in</span>
          </button>
          <button type="button" title="Show everything (0)" onClick={() => camera.fit(sb.strokes, sb.notes)}>
            <span aria-hidden="true">⤢</span>
            <span className="sr-only">Show everything</span>
          </button>
        </div>
      </div>
      <div className="scribble-dock">
        <Toolbar sb={sb} typing>
          <button
            type="button"
            className="scribble-toolbar__text scribble-toolbar__ask"
            disabled={ai.busy || (!sb.strokes.length && !sb.notes.length)}
            aria-busy={ai.busy}
            title="The AI reads what you've written or typed here and answers next to it, from Ali's CV, projects and blog"
            onClick={() => void ai.ask()}
          >
            <span aria-hidden="true">✨</span> {ai.busy ? 'reading…' : 'ask'}
          </button>
          <button
            type="button"
            className="scribble-toolbar__text"
            disabled={!sb.strokes.length && !sb.notes.length}
            onClick={() => sheetRef.current && void saveImage(sheetRef.current, sb.strokes, sb.notes, theme)}
          >
            ⬇ save image
          </button>
        </Toolbar>
        <p className="scribble-dock__hint" role="status">
          {ai.message ??
            'Endless paper: draw, or pick "Aa type" to write. Press ✨ ask and the AI answers questions about Ali right on the sheet.'}
        </p>
      </div>
    </main>
  );
}
