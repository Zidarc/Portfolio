import { useEffect, useState } from 'react';
import {
  CRAYONS,
  eraserRadius,
  loadStrokes,
  rubOut,
  saveStrokes,
  SIZES,
  touches,
  trimStrokes,
  type Stroke,
} from './brush.ts';
import { loadNotes, noteTouches, saveNotes, type Note } from './notes.ts';

/** "text" types notes (sketchpad only). */
export type Tool = 'crayon' | 'eraser' | 'text';
/** "rub" erases just what you rub over, like a real eraser; "stroke" removes whole lines. */
export type EraserMode = 'rub' | 'stroke';

/** Undo goes back this many steps. */
const HISTORY = 40;

interface Snapshot {
  strokes: Stroke[];
  notes: Note[];
}

/**
 * Strokes, typed notes, undo history and the picked tool, colour and size, kept in sessionStorage
 * under `key` (notes under `key`-notes).
 */
export function useScribbles(key: string) {
  const [strokes, setStrokes] = useState<Stroke[]>(() => loadStrokes(key));
  const [notes, setNotes] = useState<Note[]>(() => loadNotes(`${key}-notes`));
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [tool, setTool] = useState<Tool>('crayon');
  const [eraserMode, setEraserMode] = useState<EraserMode>('rub');
  const [colour, setColour] = useState<string>(CRAYONS[0].value);
  const [size, setSize] = useState<number>(SIZES[1]);

  // save shortly after things settle, not on every movement of the eraser
  useEffect(() => {
    const t = setTimeout(() => saveStrokes(key, strokes), 250);
    return () => clearTimeout(t);
  }, [key, strokes]);
  useEffect(() => saveNotes(`${key}-notes`, notes), [key, notes]);

  /** Remember the drawing as it is now, so the next change can be undone. */
  const remember = () => setHistory((h) => [...h.slice(1 - HISTORY), { strokes, notes }]);

  return {
    strokes,
    notes,
    tool,
    eraserMode,
    colour,
    size,
    eraserRadius: eraserRadius(size),
    canUndo: history.length > 0,
    setTool,
    setEraserMode: (mode: EraserMode) => {
      setEraserMode(mode);
      setTool('eraser');
    },
    /** Pick a colour: back to the crayon, unless typing (then it colours the text). */
    setColour: (c: string) => {
      setColour(c);
      setTool((t) => (t === 'text' ? 'text' : 'crayon'));
    },
    setSize,
    add: (s: Stroke) => {
      remember();
      setStrokes(trimStrokes([...strokes, s]));
    },
    /** Add a note, or replace the one with the same id (one undo step). */
    putNote: (n: Note) => {
      remember();
      setNotes((prev) => (prev.some((p) => p.id === n.id) ? prev.map((p) => (p.id === n.id ? n : p)) : [...prev, n]));
    },
    /** Add strokes and notes together, as one undo step (an AI answer and its arrow). */
    addMany: (more: { strokes?: Stroke[]; notes?: Note[] }) => {
      remember();
      if (more.strokes?.length) setStrokes((prev) => trimStrokes([...prev, ...more.strokes!]));
      if (more.notes?.length) setNotes((prev) => [...prev, ...more.notes!]);
    },
    removeNote: (id: string) => {
      remember();
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    /** Called once when the eraser touches down, so the whole rub undoes in one step. */
    eraseStart: remember,
    eraseAt: (x: number, y: number) => {
      const r = eraserRadius(size);
      setStrokes((prev) => (eraserMode === 'rub' ? rubOut(prev, x, y, r) : prev.filter((s) => !touches(s, x, y, r))));
      // typed text can't be half rubbed out: a note the eraser touches goes
      setNotes((prev) => (prev.some((n) => noteTouches(n, x, y, r)) ? prev.filter((n) => !noteTouches(n, x, y, r)) : prev));
    },
    undo: () => {
      const prev = history[history.length - 1];
      if (!prev) return;
      setHistory(history.slice(0, -1));
      setStrokes(prev.strokes);
      setNotes(prev.notes);
    },
    clear: () => {
      remember();
      setStrokes([]);
      setNotes([]);
    },
  };
}

export type Scribbles = ReturnType<typeof useScribbles>;
