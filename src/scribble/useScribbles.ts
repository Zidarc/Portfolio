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

export type Tool = 'crayon' | 'eraser';
/** "rub" erases just what you rub over, like a real eraser; "stroke" removes whole lines. */
export type EraserMode = 'rub' | 'stroke';

/** Undo goes back this many steps. */
const HISTORY = 40;

/** Strokes, undo history and the picked tool, colour and size, kept in sessionStorage under `key`. */
export function useScribbles(key: string) {
  const [strokes, setStrokes] = useState<Stroke[]>(() => loadStrokes(key));
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [tool, setTool] = useState<Tool>('crayon');
  const [eraserMode, setEraserMode] = useState<EraserMode>('rub');
  const [colour, setColour] = useState<string>(CRAYONS[0].value);
  const [size, setSize] = useState<number>(SIZES[1]);

  // save shortly after things settle, not on every movement of the eraser
  useEffect(() => {
    const t = setTimeout(() => saveStrokes(key, strokes), 250);
    return () => clearTimeout(t);
  }, [key, strokes]);

  /** Remember the drawing as it is now, so the next change can be undone. */
  const remember = () => setHistory((h) => [...h.slice(1 - HISTORY), strokes]);

  return {
    strokes,
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
    setColour: (c: string) => {
      setColour(c);
      setTool('crayon');
    },
    setSize,
    add: (s: Stroke) => {
      remember();
      setStrokes(trimStrokes([...strokes, s]));
    },
    /** Called once when the eraser touches down, so the whole rub undoes in one step. */
    eraseStart: remember,
    eraseAt: (x: number, y: number) => {
      const r = eraserRadius(size);
      setStrokes((prev) => (eraserMode === 'rub' ? rubOut(prev, x, y, r) : prev.filter((s) => !touches(s, x, y, r))));
    },
    undo: () => {
      const prev = history[history.length - 1];
      if (!prev) return;
      setHistory(history.slice(0, -1));
      setStrokes(prev);
    },
    clear: () => {
      remember();
      setStrokes([]);
    },
  };
}

export type Scribbles = ReturnType<typeof useScribbles>;
