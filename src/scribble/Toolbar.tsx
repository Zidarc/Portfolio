import type { CSSProperties, ReactNode } from 'react';
import { CRAYONS, SIZES } from './brush.ts';
import type { Scribbles } from './useScribbles.ts';

/** The crayon box: colours, sizes, eraser (two kinds), undo, clear, plus whatever actions the page adds. */
export function Toolbar({ sb, children }: { sb: Scribbles; children?: ReactNode }) {
  const erasing = sb.tool === 'eraser';

  return (
    <div className="scribble-toolbar" role="toolbar" aria-label="Scribble tools">
      <div className="scribble-toolbar__group" role="radiogroup" aria-label="Crayon colour">
        {CRAYONS.map((c) => (
          <button
            key={c.name}
            type="button"
            role="radio"
            aria-checked={!erasing && sb.colour === c.value}
            aria-label={`${c.name} crayon`}
            title={`${c.name} crayon`}
            className="scribble-toolbar__crayon"
            style={{ '--c': c.value } as CSSProperties}
            onClick={() => sb.setColour(c.value)}
          />
        ))}
      </div>
      <div className="scribble-toolbar__group" role="radiogroup" aria-label="Size">
        {SIZES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={sb.size === s}
            aria-label={`size ${s}`}
            title={`size ${s}`}
            className="scribble-toolbar__size"
            onClick={() => sb.setSize(s)}
          >
            <span style={{ width: s + 2, height: s + 2, background: erasing ? '#f4a6c0' : sb.colour }} />
          </button>
        ))}
      </div>
      <div className="scribble-toolbar__group">
        <button
          type="button"
          aria-pressed={erasing}
          className="scribble-toolbar__text"
          onClick={() => sb.setTool(erasing ? 'crayon' : 'eraser')}
        >
          🧽 eraser
        </button>
        {erasing && (
          <span className="scribble-toolbar__modes" role="radiogroup" aria-label="Eraser">
            <button
              type="button"
              role="radio"
              aria-checked={sb.eraserMode === 'rub'}
              className="scribble-toolbar__mode"
              title="erase just the bits you rub over"
              onClick={() => sb.setEraserMode('rub')}
            >
              rub out
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={sb.eraserMode === 'stroke'}
              className="scribble-toolbar__mode"
              title="erase any whole line you touch"
              onClick={() => sb.setEraserMode('stroke')}
            >
              whole line
            </button>
          </span>
        )}
        <button type="button" className="scribble-toolbar__text" onClick={sb.undo} disabled={!sb.canUndo}>
          ↶ undo
        </button>
        <button type="button" className="scribble-toolbar__text" onClick={sb.clear} disabled={!sb.strokes.length}>
          🗑 clear
        </button>
      </div>
      {children && <div className="scribble-toolbar__group">{children}</div>}
    </div>
  );
}
