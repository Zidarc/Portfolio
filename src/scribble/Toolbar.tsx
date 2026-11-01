import type { CSSProperties, ReactNode } from 'react';
import { useTheme } from '../theme.ts';
import { CRAYONS, shownColour, SIZES } from './brush.ts';
import type { Scribbles } from './useScribbles.ts';

/**
 * The crayon box: colours, sizes, eraser (two kinds), undo, clear, plus whatever actions the page adds.
 * On the blackboard the crayons are sticks of chalk (scribble.css) and the eraser is a felt duster.
 * `typing` adds the text tool (the sketchpad); the colour and size then apply to the text.
 */
export function Toolbar({ sb, typing = false, children }: { sb: Scribbles; typing?: boolean; children?: ReactNode }) {
  const erasing = sb.tool === 'eraser';
  const texting = sb.tool === 'text';
  const stick = useTheme() === 'dark' ? 'chalk' : 'crayon';

  return (
    // pressing a button doesn't take the focus, so you can pick a colour or size mid-sentence and keep typing
    <div
      className="scribble-toolbar"
      role="toolbar"
      aria-label="Scribble tools"
      onMouseDown={(e) => (e.target as HTMLElement).closest('button') && e.preventDefault()}
    >
      <div className="scribble-toolbar__group" role="radiogroup" aria-label={`${stick === 'chalk' ? 'Chalk' : 'Crayon'} colour`}>
        {CRAYONS.map((c) => (
          <button
            key={c.name}
            type="button"
            role="radio"
            aria-checked={!erasing && sb.colour === c.value}
            aria-label={`${c.name} ${stick}`}
            title={`${c.name} ${stick}`}
            className="scribble-toolbar__crayon"
            style={{ '--c': shownColour(c.value) } as CSSProperties}
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
            <span style={{ width: s + 2, height: s + 2, background: erasing ? 'var(--eraser-colour)' : shownColour(sb.colour) }} />
          </button>
        ))}
      </div>
      <div className="scribble-toolbar__group">
        {typing && (
          <button
            type="button"
            aria-pressed={texting}
            className="scribble-toolbar__text"
            title="Type on the sketchpad: click anywhere to start, click a note to edit it, drag it to move it"
            onClick={() => sb.setTool(texting ? 'crayon' : 'text')}
          >
            <span aria-hidden="true">Aa</span> type
          </button>
        )}
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
        <button type="button" className="scribble-toolbar__text" onClick={sb.clear} disabled={!sb.strokes.length && !sb.notes.length}>
          🗑 clear
        </button>
      </div>
      {children && <div className="scribble-toolbar__group">{children}</div>}
    </div>
  );
}
