import { expect, test, type Page } from '@playwright/test';

/** Fails the test on any uncaught error in the page. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

const savedStrokes = (page: Page) =>
  page.evaluate(() => (JSON.parse(sessionStorage.getItem('scribbles-sketchpad') ?? '[]') as unknown[]).length);
const savedNotes = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('scribbles-sketchpad-notes') ?? '[]') as { t: string; ai?: { link?: unknown } }[]);

/** A short scribble across the middle of the sheet. */
async function scribble(page: Page) {
  const box = (await page.locator('.sketchpad__sheet').boundingBox())!;
  const x = box.x + box.width * 0.3;
  const y = box.y + box.height * 0.7;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(x + i * 12, y + (i % 2) * 14);
  await page.mouse.up();
}

test('the landing page loads, with the sketchpad in the menu', async ({ page, isMobile }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page).toHaveTitle(/Ali Hussain/);
  await expect(page.locator('#projects')).toBeAttached();
  if (isMobile) {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Sketchpad' })).toBeVisible();
  } else {
    await expect(page.locator('.nav__sketchpad')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('the blog loads', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/blog');
  await expect(page).toHaveTitle(/Blog/);
  expect(errors).toEqual([]);
});

test('the sketchpad answers a starter question, with a link', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/draw');
  await page.locator('.sketchpad__starters button').first().click();
  // (practice answers: AI_PRACTICE=1)
  await expect(page.locator('.scribble-surface__link')).toBeVisible();
  const notes = await savedNotes(page);
  expect(notes.filter((n) => !n.ai)).toHaveLength(1);
  expect(notes.filter((n) => n.ai?.link)).toHaveLength(1);
  await expect(page.locator('.sketchpad__starters')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the sketchpad draws, types, and draws again after typing', async ({ page, isMobile }) => {
  test.skip(isMobile, 'drawn with a mouse');
  const errors = watchErrors(page);
  await page.goto('/draw');
  await scribble(page);
  await expect.poll(() => savedStrokes(page)).toBe(1);

  // type a note
  await page.getByRole('button', { name: 'type', exact: true }).click();
  const box = (await page.locator('.sketchpad__sheet').boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await page.keyboard.type('hello there');
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await savedNotes(page)).map((n) => n.t)).toContain('hello there');
  // after typing, picking a crayon goes back to drawing (this once broke)
  await page.getByRole('radio', { name: /blue/i }).click();
  await scribble(page);
  await expect.poll(() => savedStrokes(page)).toBe(2);
  expect(errors).toEqual([]);
});
