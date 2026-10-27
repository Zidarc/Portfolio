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
docker run -p 8080:80 portfolio   # http://localhost:8080
```
CI builds and pushes `ghcr.io/zidarc/portfolio:latest` on every push to `main`.

## Layout
- `src/data/projects.ts`: the project list that drives the project boxes
- `src/styles/`: design tokens (crayon colours, paper) and global styles
- `legacy/`: the previous HTML/CSS/jQuery version, kept for reference

## Author
Ali Hussain
