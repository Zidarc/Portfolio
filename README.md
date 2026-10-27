# Portfolio Website

Ali Hussain's personal portfolio: a hand-drawn, crayon-on-paper site where the text writes itself stroke by stroke.

Live demo: https://ali-hussain-portfolio.netlify.app/

## Stack
- Vite + React + TypeScript
- Custom SVG crayon stroke engine (in progress)

## Run locally
```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build
```

## Docker
```bash
docker build -t portfolio .
docker run -p 8080:8080 --env-file .env.local portfolio   # http://localhost:8080
```
The image runs a small Node server (`server/index.ts`) that serves the site and the contact form API.
CI builds and pushes `ghcr.io/zidarc/portfolio:latest` on every push to `main`.

## Contact form email
Messages are sent through the Gmail API (send-only scope). Setup: [docs/email-setup.md](docs/email-setup.md).
Without credentials, `npm run dev` prints messages to the terminal instead of sending them.

Add `?lab` to the URL (e.g. http://localhost:5173/?lab) to open the crayon test bench.

## Layout
- `src/crayon/`: the crayon engine (handwriting, doodles, wax texture filter)
- `src/sections/`: page sections (Hero, …)
- `public/ali.jpg`: the profile photo shown in the hero (a crayon smiley shows if it's missing)
- `src/data/projects.ts`: the project list that drives the project boxes
- `src/styles/`: design tokens (crayon colours, paper) and global styles
- `legacy/`: the previous HTML/CSS/jQuery version, kept for reference

## Author
Ali Hussain
