// Takes a small screenshot of each project's live site, for the sketchpad's AI to tape next to an answer
// about that project. Re-run when a site changes, then look at each picture before committing it.
//
// Usage: node scripts/project-shots.mjs              (every project with a live site)
//        node scripts/project-shots.mjs synergy      (just these ids)
//
// Writes public/projects/<id>.jpg (640×400). A project uses its picture once `shot` is set in
// src/data/projects.ts.

import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { projects } from '../src/data/projects.ts';

const only = process.argv.slice(2);
const todo = projects.filter((p) => p.live && (!only.length || only.includes(p.id)));
mkdirSync('public/projects', { recursive: true });

// the installed Edge locally, Playwright's own Chromium elsewhere
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
for (const p of todo) {
  // a desktop-sized page, shrunk to half
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5, colorScheme: 'light' });
  try {
    await page.goto(p.live, { waitUntil: 'networkidle', timeout: 30_000 });
  } catch {
    console.warn(`${p.id}: still loading after 30 s; taking what's there`);
  }
  // past any intro, to the page itself
  const skip = page.getByRole('button', { name: /skip intro/i }).or(page.getByRole('link', { name: /skip intro/i }));
  if (await skip.count()) await skip.first().click().catch(() => {});
  await page.waitForTimeout(2_500); // intros and fonts
  await page.screenshot({ path: `public/projects/${p.id}.jpg`, type: 'jpeg', quality: 72 });
  console.log(`${p.id}: public/projects/${p.id}.jpg`);
  await page.close();
}
await browser.close();
