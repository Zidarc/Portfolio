/**
 * Crayon drawings wait for the page to stop scrolling before they start: while the visitor is moving
 * nothing animates (scrolling stays smooth), and when they stop to look, things draw in front of them.
 * One passive scroll listener for the whole page; nothing runs while nobody is waiting.
 */

/** How long the page must be still before drawings start, in ms. */
const SETTLE_MS = 160;

let lastScroll = -Infinity;
let timer = 0;
let listening = false;
const waiting = new Set<() => void>();

function flush() {
  timer = 0;
  const due = [...waiting];
  waiting.clear();
  due.forEach((start) => start());
}

function onScroll() {
  lastScroll = performance.now();
  if (!waiting.size) return;
  clearTimeout(timer);
  timer = window.setTimeout(flush, SETTLE_MS);
}

/** Run `start` as soon as the page isn't scrolling. Returns a function that cancels the wait. */
export function whenScrollSettles(start: () => void): () => void {
  if (!listening) {
    window.addEventListener('scroll', onScroll, { passive: true });
    listening = true;
  }
  const since = performance.now() - lastScroll;
  if (since >= SETTLE_MS) {
    start();
    return () => {};
  }
  waiting.add(start);
  clearTimeout(timer);
  timer = window.setTimeout(flush, SETTLE_MS - since);
  return () => waiting.delete(start);
}
