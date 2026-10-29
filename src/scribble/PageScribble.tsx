import { useEffect, useState } from 'react';
import { useToolCursor } from './cursors.ts';
import { ScribbleSurface } from './ScribbleSurface.tsx';
import { Toolbar } from './Toolbar.tsx';
import { useScribbles } from './useScribbles.ts';
import './scribble.css';

/**
 * Scribble on the site itself: a sheet as tall as the page sits over everything, so the drawings
 * scroll with the content. It only takes the pointer while drawing is switched on.
 */
export function PageScribble() {
  const sb = useScribbles('scribbles-page');
  const [on, setOn] = useState(false);
  const [height, setHeight] = useState(0);
  useToolCursor(sb, on);

  // the sheet covers the whole page, however tall the content grows
  useEffect(() => {
    const ro = new ResizeObserver(() => setHeight(document.body.offsetHeight));
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  // Escape puts the crayon down
  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOn(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [on]);

  return (
    <>
      {/* the page-tall sheet only exists once there's something on it, or while drawing */}
      {(on || sb.strokes.length > 0) && (
        <ScribbleSurface sb={sb} active={on} className="scribble-surface--page" style={{ height }} />
      )}
      {on ? (
        <div className="scribble-dock">
          <Toolbar sb={sb}>
            <a className="scribble-toolbar__text" href="/draw" target="_blank" rel="noreferrer">
              sketchpad ↗
            </a>
            <button
              type="button"
              className="scribble-toolbar__text scribble-toolbar__done"
              onClick={() => setOn(false)}
            >
              done ✓
            </button>
          </Toolbar>
          <p className="scribble-dock__hint">Your scribbles stay until you close this tab.</p>
        </div>
      ) : (
        <button type="button" className="scribble-toggle" onClick={() => setOn(true)}>
          <span aria-hidden="true">🖍</span> scribble
        </button>
      )}
    </>
  );
}
