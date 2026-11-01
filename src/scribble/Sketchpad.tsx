import { useRef } from 'react';
import { ThemeButton } from '../components/ThemeButton.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { useTheme, type Theme } from '../theme.ts';
import { chalkOf } from './brush.ts';
import { useToolCursor } from './cursors.ts';
import { ScribbleSurface } from './ScribbleSurface.tsx';
import { Toolbar } from './Toolbar.tsx';
import { useScribbles } from './useScribbles.ts';
import './scribble.css';

/**
 * Turn the drawing into a PNG and download it: crayon on paper, or chalk on the blackboard at night.
 * The image can't see the page's CSS variables, so the chalk colours are written in.
 */
async function saveImage(sheet: HTMLElement, theme: Theme) {
  const night = theme === 'dark';
  const svg = sheet.querySelector('svg');
  if (!svg) return;
  const { width, height } = sheet.getBoundingClientRect();
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', String(width));
  copy.setAttribute('height', String(height));
  const img = new Image();
  let markup = new XMLSerializer().serializeToString(copy);
  if (night) markup = markup.replace(/var\(--crayon-\w+, (#[0-9a-f]{6})\)/g, (_, hex: string) => chalkOf(hex));
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await img.decode();
  const scale = 2;
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

/** /draw: a whole sheet of paper to play with the crayons (a blackboard and chalk at night). Kept until the tab is closed. */
export function Sketchpad() {
  const sb = useScribbles('scribbles-sketchpad');
  const theme = useTheme();
  const sheetRef = useRef<HTMLDivElement>(null);
  useToolCursor(sb, true);

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
        <ScribbleSurface sb={sb} active />
      </div>
      <div className="scribble-dock">
        <Toolbar sb={sb}>
          <button
            type="button"
            className="scribble-toolbar__text"
            disabled={!sb.strokes.length}
            onClick={() => sheetRef.current && void saveImage(sheetRef.current, theme)}
          >
            ⬇ save image
          </button>
        </Toolbar>
        <p className="scribble-dock__hint">Your drawing stays until you close this tab.</p>
      </div>
    </main>
  );
}
