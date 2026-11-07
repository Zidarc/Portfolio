import { memo, startTransition, useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';
import { CrayonDrawing } from '../crayon/CrayonDrawing.tsx';
import { useTheme } from '../theme.ts';
import { answerHand, answerSize, freshAnswers, LINK_GAP, LINK_SIZE } from './answers.ts';
import { crayonPasses, grainTile, shownColour, type Pass, type Stroke } from './brush.ts';
import { homeView, overlaps, strokeBox, visibleBox, zoomAt, type Camera, type View } from './camera.ts';
import { toolCursor } from './cursors.ts';
import { firstBaseline, LINE, newNoteId, NOTE_FONT, noteAt, noteLines, noteMeasure, noteSize, type Note } from './notes.ts';
import type { Scribbles } from './useScribbles.ts';

interface SurfaceProps {
  sb: Scribbles;
  /** Drawing is on: the surface takes the pointer (and stops touch scrolling). */
  active: boolean;
  /** The sketchpad's endless canvas: pan and zoom around. Without it the surface is a fixed sheet. */
  camera?: Camera;
  /** The hand tool is picked: dragging moves the canvas instead of drawing. */
  panning?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Each stroke's crayon lines, worked out once (a stroke moving back into view isn't redone). */
const passCache = new WeakMap<Stroke, Pass[]>();
const passesOf = (s: Stroke) => passCache.get(s) ?? passCache.set(s, crayonPasses(s)).get(s)!;

const StrokeView = memo(function StrokeView({ stroke }: { stroke: Stroke }) {
  return (
    <g stroke={shownColour(stroke.c)}>
      {passesOf(stroke).map((pass, i) => (
        <path key={i} d={pass.d} strokeWidth={pass.width} strokeOpacity={pass.opacity} />
      ))}
    </g>
  );
});

/** A typed note, set in the handwriting font. Not under the crayon-grain mask, so it stays crisp. */
const NoteView = memo(function NoteView({ note }: { note: Note }) {
  const base = note.y + firstBaseline(note.s);
  return (
    <text fill={shownColour(note.c)} fontFamily={NOTE_FONT} fontSize={note.s} style={{ whiteSpace: 'pre' }}>
      {noteLines(note.t).map((line, i) => (
        <tspan key={i} x={note.x} y={base + i * note.s * LINE}>
          {line || ' '}
        </tspan>
      ))}
    </text>
  );
});

/**
 * An AI answer, written in crayon handwriting. One that's just been placed writes itself in, stroke by
 * stroke; one already on the sheet is simply there. It sits under the sheet's crayon-grain mask like the
 * visitor's own crayon, so it needs no texture filter of its own (filters that redraw while the canvas
 * moves would cost smoothness). The line settings are attributes, not CSS, so a saved image keeps them.
 */
const AnswerView = memo(function AnswerView({ note }: { note: Note }) {
  const { plan, scale, seed } = answerHand(note);
  const [fresh] = useState(() => freshAnswers.has(note.id));
  return (
    <g transform={`translate(${note.x} ${note.y}) scale(${scale})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* An svg inside an svg ignores CSS width and height (Chrome sizes it from attributes only, else 100% of
          the sheet), so this one sets the size in attributes and the crayon drawing fills it. */}
      <svg width={plan.width} height={plan.height} overflow="visible">
        <CrayonDrawing
          plan={plan}
          seed={seed}
          label={note.t}
          decorative
          texture={false}
          instant={!fresh}
          color={shownColour(note.c)}
          onDone={() => freshAnswers.delete(note.id)}
        />
      </svg>
    </g>
  );
});

/** A press with the text tool: on a note (to edit it, or drag it somewhere else) or on empty paper. */
interface Press {
  id: number;
  note?: Note;
  sx: number;
  sy: number;
  wx: number;
  wy: number;
  moved: boolean;
}

/** After the last scroll-wheel tick, how long before the moved view is drawn for real. */
const WHEEL_SETTLE_MS = 160;

type Gesture =
  | { kind: 'pan'; id: number; from: View; sx: number; sy: number }
  | { kind: 'pinch'; from: View; mx: number; my: number; d: number };

/**
 * Where scribbles are drawn and shown. Points are stored in world units (camera.ts): on the site's
 * page sheet that's from the sheet's top centre, so the drawings stay with the content when the window
 * is resized. Strokes are plain SVG: scrolling the page never redraws them, and only the stroke being
 * drawn re-renders while the pointer moves.
 *
 * On the sketchpad's endless canvas, moving around is kept just as cheap: while a pan or pinch is under
 * way, only a CSS transform on one layer changes (the GPU slides and scales the picture it already has).
 * The new view is drawn once, when the gesture ends. Strokes well off screen aren't drawn at all.
 */
export function ScribbleSurface({ sb, active, camera, panning = false, className, style }: SurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [current, setCurrent] = useState<Stroke | null>(null);
  const drawing = useRef<Stroke | null>(null);
  const uid = useId().replace(/:/g, '');
  const [tile] = useState(grainTile);
  const erasing = sb.tool === 'eraser';
  const theme = useTheme();

  const view = camera?.saved ?? homeView(size.width);
  /** The view on screen mid-gesture (ahead of `view`, which only changes when the gesture ends). */
  const live = useRef(view);
  live.current = view;
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const typing = sb.tool === 'text';
  /** The note being typed: a working copy, saved (as one undo step) when you click away. */
  const [draft, setDraft] = useState<{ note: Note; isNew: boolean } | null>(null);
  const press = useRef<Press | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const moving = panning || spaceHeld;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry?.contentRect ?? { width: 0, height: 0 };
      setSize({ width, height });
      if (camera) camera.size.current = { width, height };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [camera]);

  /** Show `v` straight away by sliding/scaling the layer (no re-render). */
  const preview = (v: View) => {
    live.current = v;
    const layer = layerRef.current;
    if (!layer) return;
    const s = v.z / view.z;
    layer.style.transform = `translate(${(view.x - v.x) * v.z}px, ${(view.y - v.y) * v.z}px) scale(${s})`;
    layer.classList.add('is-moving');
  };

  /** Draw the moved view for real, and drop the layer's stand-in transform in the same frame. */
  const settle = () => {
    const layer = layerRef.current;
    if (!camera || !layer?.classList.contains('is-moving')) return;
    flushSync(() => camera.commit(live.current));
    layer.style.transform = '';
    layer.classList.remove('is-moving');
  };

  // scroll wheel / trackpad: scroll to move, ctrl (or a trackpad pinch) to zoom. It has to be a
  // non-passive listener to stop the browser zooming the whole page.
  const settleRef = useRef(settle);
  settleRef.current = settle;
  const previewRef = useRef(preview);
  previewRef.current = preview;
  useEffect(() => {
    const el = ref.current;
    if (!el || !camera) return;
    let timer = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const v = live.current;
      const unit = e.deltaMode === 1 ? 16 : 1; // lines → pixels
      previewRef.current(
        e.ctrlKey
          ? zoomAt(v, Math.exp(-e.deltaY * unit * 0.01), e.clientX - r.left, e.clientY - r.top)
          : {
              ...v,
              x: v.x + ((e.shiftKey ? e.deltaY : e.deltaX) * unit) / v.z,
              y: v.y + ((e.shiftKey ? 0 : e.deltaY) * unit) / v.z,
            },
      );
      clearTimeout(timer);
      timer = window.setTimeout(() => settleRef.current(), WHEEL_SETTLE_MS);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      clearTimeout(timer);
    };
  }, [camera]);

  // hold space to move the canvas with the mouse
  useEffect(() => {
    if (!camera) return;
    // (space still presses a focused button or types in a text field)
    const typing = (e: KeyboardEvent) =>
      (e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable], button, a, select');
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || typing(e)) return;
      e.preventDefault();
      setSpaceHeld(true);
    };
    const up = (e: KeyboardEvent) => e.code === 'Space' && setSpaceHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [camera]);

  const local = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /** The pointer in world units. */
  const point = (e: PointerEvent) => {
    const { x, y } = local(e);
    const v = live.current;
    return [Math.round(v.x + x / v.z), Math.round(v.y + y / v.z)] as const;
  };

  /** The eraser's reach follows the pointer as a faint ring (set directly: no re-render per move). */
  const moveRing = (x: number, y: number) => {
    ringRef.current?.setAttribute('cx', String(x));
    ringRef.current?.setAttribute('cy', String(y));
  };

  const startPinch = () => {
    const [a, b] = [...touches.current.values()];
    if (!a || !b) return;
    gesture.current = { kind: 'pinch', from: live.current, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
  };

  const down = (e: PointerEvent) => {
    if (!active) return;
    if (e.button === 1) e.preventDefault(); // no auto-scroll on middle click: it moves the canvas
    const pos = local(e);
    if (camera && e.pointerType === 'touch') touches.current.set(e.pointerId, pos);
    e.currentTarget.setPointerCapture(e.pointerId);

    // a second finger: whatever the first one started becomes a pinch (a half-drawn line is dropped)
    if (camera && touches.current.size === 2) {
      drawing.current = null;
      setCurrent(null);
      startPinch();
      return;
    }
    // the hand tool, space, or dragging with the middle or right mouse button moves the sheet
    if (camera && (moving || e.button === 1 || e.button === 2)) {
      gesture.current = { kind: 'pan', id: e.pointerId, from: live.current, sx: pos.x, sy: pos.y };
      return;
    }
    if (e.button > 0 || gesture.current) return;
    const [x, y] = point(e);
    if (typing) {
      // while a note is open, clicking elsewhere just finishes it
      if (draft) return editorRef.current?.blur();
      press.current = { id: e.pointerId, note: noteAt(sb.notes, x, y), sx: pos.x, sy: pos.y, wx: x, wy: y, moved: false };
      return;
    }
    if (erasing) {
      sb.eraseStart();
      sb.eraseAt(x, y);
      return;
    }
    drawing.current = { c: sb.colour, s: sb.size, p: [x, y] };
    setCurrent({ ...drawing.current });
  };

  const move = (e: PointerEvent) => {
    if (!active) return;
    const g = gesture.current;
    if (g) {
      const pos = local(e);
      if (g.kind === 'pan' && e.pointerId === g.id) {
        preview({ ...g.from, x: g.from.x - (pos.x - g.sx) / g.from.z, y: g.from.y - (pos.y - g.sy) / g.from.z });
      } else if (g.kind === 'pinch' && touches.current.has(e.pointerId)) {
        touches.current.set(e.pointerId, pos);
        const [a, b] = [...touches.current.values()];
        if (!a || !b) return;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        // zoom around where the fingers started, then follow the fingers' midpoint
        const zoomed = zoomAt(g.from, Math.hypot(a.x - b.x, a.y - b.y) / g.d, g.mx, g.my);
        preview({ ...zoomed, x: zoomed.x - (mx - g.mx) / zoomed.z, y: zoomed.y - (my - g.my) / zoomed.z });
      }
      return;
    }
    if (camera && e.pointerType === 'touch') touches.current.set(e.pointerId, local(e));
    const pr = press.current;
    if (pr?.note && e.pointerId === pr.id) {
      // dragging a note moves it (shown live by moving the drawn text; saved when let go)
      const pos = local(e);
      if (!pr.moved && Math.hypot(pos.x - pr.sx, pos.y - pr.sy) < 5) return;
      pr.moved = true;
      const [x, y] = point(e);
      const text = ref.current?.querySelector(`[data-note="${pr.note.id}"]`);
      text?.setAttribute('transform', `translate(${x - pr.wx} ${y - pr.wy})`);
      return;
    }
    const [x, y] = point(e);
    if (erasing) moveRing(x, y);
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (erasing) return sb.eraseAt(x, y);
    const stroke = drawing.current;
    if (!stroke) return;
    const lx = stroke.p[stroke.p.length - 2]!;
    const ly = stroke.p[stroke.p.length - 1]!;
    // skip tiny jitters (measured on screen, so zooming doesn't change how smooth lines are)
    if (((x - lx) ** 2 + (y - ly) ** 2) * live.current.z ** 2 < 6) return;
    stroke.p.push(x, y);
    setCurrent({ ...stroke, p: stroke.p.slice() });
  };

  const up = (e: PointerEvent) => {
    touches.current.delete(e.pointerId);
    const g = gesture.current;
    if (g) {
      // a pinch ends when the fingers lift; the finger left behind doesn't start drawing
      if (g.kind === 'pinch' && touches.current.size > 0) return;
      if (g.kind === 'pan' && e.pointerId !== g.id) return;
      gesture.current = null;
      settle();
      return;
    }
    const pr = press.current;
    if (pr && e.pointerId === pr.id) {
      press.current = null;
      if (e.type === 'pointercancel') return;
      const [x, y] = point(e);
      if (pr.note && pr.moved) {
        ref.current?.querySelector(`[data-note="${pr.note.id}"]`)?.removeAttribute('transform');
        sb.putNote({ ...pr.note, x: pr.note.x + x - pr.wx, y: pr.note.y + y - pr.wy });
      } else if (pr.note?.ai) {
        // the AI's answers can be moved or rubbed out, but they're its words: not edited as typed text
      } else if (pr.note) {
        flushSync(() => setDraft({ note: pr.note!, isNew: false }));
      } else {
        // a new note, with the click about halfway down its first line
        const s = noteSize(sb.size);
        const note = { id: newNoteId(), x, y: Math.round(y - s * LINE * 0.5), t: '', c: sb.colour, s };
        // (flushSync so the editor is focused inside the tap itself: phones only open the keyboard then)
        flushSync(() => setDraft({ note, isNew: true }));
      }
      return;
    }
    const stroke = drawing.current;
    drawing.current = null;
    setCurrent(null);
    if (stroke) sb.add(stroke);
  };

  /** Done typing: keep the note (one undo step), or drop it if it was emptied. */
  const finishTyping = () => {
    if (!draft) return;
    const { note, isNew } = draft;
    setDraft(null);
    const saved = sb.notes.find((n) => n.id === note.id);
    if (!note.t.trim()) {
      if (!isNew) sb.removeNote(note.id);
    } else if (!saved || saved.t !== note.t || saved.c !== note.c || saved.s !== note.s) {
      sb.putNote({ ...note, t: note.t.replace(/\s+$/, '') });
    }
  };

  // picking a colour or size while typing changes the note being typed
  useEffect(() => setDraft((d) => (d ? { ...d, note: { ...d.note, c: sb.colour } } : d)), [sb.colour]);
  useEffect(() => setDraft((d) => (d ? { ...d, note: { ...d.note, s: noteSize(sb.size) } } : d)), [sb.size]);
  // putting the text tool down finishes the note
  useEffect(() => {
    if (!typing) editorRef.current?.blur();
  }, [typing]);

  // On the endless canvas, strokes more than a screen away aren't drawn. Which ones that is gets worked
  // out after a move has settled, as a background update React does in small slices, so bringing a
  // hundred strokes into view never holds up a frame. (They were a screen ahead, so nothing pops in.)
  const [cullView, setCullView] = useState(view);
  const viewKey = `${view.x} ${view.y} ${view.z}`;
  useEffect(() => startTransition(() => setCullView(view)), [viewKey]); // (view itself is a new object every render)
  const near = camera && size.width ? visibleBox(cullView, size.width, size.height) : null;
  const cursor = moving ? (gesture.current ? 'grabbing' : 'grab') : toolCursor(sb, theme);
  const drafted = draft && noteMeasure(draft.note);

  return (
    <div
      ref={ref}
      className={['scribble-surface', active ? 'is-active' : '', className].filter(Boolean).join(' ')}
      style={active ? { ...style, cursor } : style}
      onPointerDown={down}
      // (the right button moves the sheet, so its menu would only get in the way)
      onContextMenu={camera ? (e) => e.preventDefault() : undefined}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={() => moveRing(-1e7, -1e7)}
    >
      <div ref={layerRef} className="scribble-surface__layer">
        <svg className="scribble-surface__svg" aria-hidden="true">
          <defs>
            <pattern id={`${uid}-grain`} width="96" height="96" patternUnits="userSpaceOnUse">
              <image href={tile} width="96" height="96" />
            </pattern>
            <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse" x="-1000000" y="-1000000" width="2000000" height="2000000">
              <rect x="-1000000" y="-1000000" width="2000000" height="2000000" fill={`url(#${uid}-grain)`} />
            </mask>
          </defs>
          <g data-world transform={`scale(${view.z}) translate(${-view.x} ${-view.y})`}>
            <g fill="none" strokeLinecap="round" strokeLinejoin="round" mask={`url(#${uid}-mask)`}>
              {sb.strokes.map((s, i) => (!near || overlaps(strokeBox(s), near) ? <StrokeView key={i} stroke={s} /> : null))}
              {current && <StrokeView stroke={current} />}
              {sb.notes.map((n) =>
                n.ai ? (
                  <g key={n.id} data-note={n.id}>
                    <AnswerView note={n} />
                  </g>
                ) : null,
              )}
            </g>
            <g>
              {sb.notes.map((n) =>
                n.ai || n.id === draft?.note.id ? null : (
                  <g key={n.id} data-note={n.id}>
                    <NoteView note={n} />
                  </g>
                ),
              )}
            </g>
            {active && erasing && (
              <circle ref={ringRef} cx="-1e7" cy="-1e7" r={sb.eraserRadius} className="scribble-surface__ring" />
            )}
          </g>
        </svg>
        {draft && drafted && (
          // the note being typed: a real text field laid exactly over where the text will sit
          <textarea
            ref={editorRef}
            className="scribble-surface__editor"
            aria-label="Type on the sketchpad"
            autoFocus
            spellCheck={false}
            value={draft.note.t}
            rows={1}
            style={{
              left: (draft.note.x - view.x) * view.z,
              top: (draft.note.y - view.y) * view.z,
              width: (drafted.w + draft.note.s) * view.z,
              height: drafted.h * view.z,
              fontSize: draft.note.s * view.z,
              lineHeight: LINE,
              color: shownColour(draft.note.c),
            }}
            onChange={(e) => setDraft({ ...draft, note: { ...draft.note, t: e.target.value } })}
            onBlur={finishTyping}
            onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
            onPointerDown={(e) => e.stopPropagation()}
          />
        )}
        {sb.notes.map((n) => {
          // an answer's link (a project, a post, the contact form): under it, once it's written
          const link = n.ai?.link;
          if (!link) return null;
          const { plan } = answerHand(n);
          const { h } = answerSize(n);
          return (
            <a
              key={n.id}
              className="scribble-surface__link"
              href={link.href}
              target="_blank"
              rel="noopener"
              style={{
                left: (n.x - view.x) * view.z,
                top: (n.y + h + LINK_GAP - view.y) * view.z,
                fontSize: LINK_SIZE * view.z,
                color: shownColour(n.c),
                animationDelay: freshAnswers.has(n.id) ? `${Math.round(plan.totalDuration)}ms` : '0ms',
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              → {link.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
