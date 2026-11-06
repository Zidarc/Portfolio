import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke tests (tests/): the pages load, the sketchpad draws, types and asks. Run with `npm test`.
 * They use the dev server with AI_PRACTICE=1, so the sketchpad gets practice answers: no AI keys, and
 * none of the free AI allowance spent.
 */
const PORT = 5199;

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // locally, the installed Edge or Chrome is fine; CI installs Playwright's Chromium
    ...(process.env.CI ? {} : { channel: process.env.PW_CHANNEL ?? 'msedge' }),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...(process.env.CI ? {} : { channel: process.env.PW_CHANNEL ?? 'msedge' }) } },
    { name: 'phone', use: { ...devices['Pixel 7'], ...(process.env.CI ? {} : { channel: process.env.PW_CHANNEL ?? 'msedge' }) } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { AI_PRACTICE: '1' },
    timeout: 60_000,
  },
});
