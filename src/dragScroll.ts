/**
 * Hold the right mouse button and drag to move the page, like grabbing a sheet of paper (the sketchpad's
 * hand tool, for the rest of the site). A right-click that doesn't move still opens the normal menu.
 *
 * Where the menu opens as the button goes down (macOS, Linux), the menu wins and nothing is dragged;
 * on Windows the menu waits for the button to come up, so dragging works and the menu is skipped.
 */

/** How far (px) the mouse moves before a right-press counts as a drag. */
const THRESHOLD = 4;

let installed = false;

export function installDragScroll() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  let press: { id: number; x: number; y: number; dragging: boolean } | null = null;
  /** A drag just finished: the menu that follows the button coming up is skipped. */
  let justDragged = false;

  const end = () => {
    if (press?.dragging) {
      justDragged = true;
      document.documentElement.classList.remove('is-drag-scrolling');
      // (the contextmenu event comes right after pointerup; clear the flag soon after, in case it doesn't)
      setTimeout(() => (justDragged = false), 300);
    }
    press = null;
  };

  window.addEventListener('pointerdown', (e) => {
    // a new press: the menu skipped after the last drag has had its chance (where the menu comes as the
    // button goes down, none follows a drag, and the next right-click must still get its menu)
    justDragged = false;
    if (e.pointerType !== 'mouse' || e.button !== 2) return;
    // text fields and the sketchpad sheet keep their own right-click
    if ((e.target as Element | null)?.closest('input, textarea, select, [contenteditable], .sketchpad__sheet')) return;
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, dragging: false };
  });

  window.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    // the button was let go somewhere we didn't hear about (outside the window)
    if (!(e.buttons & 2)) return end();
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    if (!press.dragging) {
      if (Math.hypot(dx, dy) < THRESHOLD) return;
      press.dragging = true;
      document.documentElement.classList.add('is-drag-scrolling');
    }
    // 'instant': the page's smooth scrolling would lag behind the hand
    window.scrollBy({ left: -dx, top: -dy, behavior: 'instant' });
    press.x = e.clientX;
    press.y = e.clientY;
  });

  window.addEventListener('pointerup', (e) => {
    if (press && e.pointerId === press.id) end();
  });
  window.addEventListener('blur', end);

  window.addEventListener('contextmenu', (e) => {
    if (justDragged || press?.dragging) {
      e.preventDefault();
      justDragged = false;
    }
  });
}
