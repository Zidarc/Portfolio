# Ali Hussain · Portfolio

A portfolio drawn in crayon. Every heading, doodle and outline on the page is drawn stroke by stroke as you
scroll to it, the whole site is paper you can scribble on, and a sketchpad lets you ask an AI about me by
writing questions on the sheet.

**Live:** https://ali-hussain-portfolio.netlify.app · **Sketchpad:** [/draw](https://ali-hussain-portfolio.netlify.app/draw) · **Blog:** [/blog](https://ali-hussain-portfolio.netlify.app/blog)

Built with React 19, TypeScript and Vite. There's no UI library, no canvas library and no animation library:
the crayon rendering is written from scratch in SVG.

---

## What's on the site

### The landing page
About, Roles, Skills, Projects and Contact, each written in crayon handwriting the moment it scrolls into view.

- **Project boxes:** each of the 13 projects gets its own small animated scene (a galaxy, a stock ticker, a
  pixel room…). A scene only moves while you're looking at it.
- **Scribble mode:** press "scribble" and draw right over the page, with nine crayons, four sizes and an
  eraser.
- **Day and night:** paper and crayon by day, blackboard and chalk by night. The switch wipes across the
  page from where you clicked, and moving between pages turns the sheet.
- **Billo:** the black pixel cat from my [GitHub profile](https://github.com/Zidarc). The hero shows her
  live mood, and visitors feed her through GitHub issues. She also hides somewhere on this site.
- **Sound** (off by default): paper and crayon sounds, synthesised with Web Audio, so there are no audio
  files.
- **Contact form:** messages go to my inbox through the Gmail API.

### The sketchpad (`/draw`)
An endless sheet of paper: pan, zoom, draw, and type with **Aa type**. Press **✨ ask** and an AI reads the
sheet, answers questions about me in crayon handwriting next to each question, and draws an arrow to the
answer if there's no room nearby. **Save image** downloads the whole sheet as a PNG.

### The blog (`/blog`)
Posts are Markdown files in `content/blog/`, turned into pages at build time. The AI reads them too.

---

## How the crayon works

`src/crayon/` turns text and shapes into crayon strokes:

- **Handwriting:** a single-line Hershey font, wobbled per letter, so no two letters come out quite alike.
  Each letter is written in stroke order, every stroke timed by its length with a little human unevenness.
- **Wax texture:** an SVG filter roughens the edges, specks the line where the paper's tooth stops the wax,
  and varies how hard the crayon was pressed.
- **Doodles and shapes:** arrows, hearts and boxes are hand-tuned paths, drawn with the same engine.
- **Smoothness:**
  - The heavy path work runs in a Web Worker.
  - Drawings wait until you stop scrolling before they animate.
  - Off-screen project cards aren't rendered.
  - Changes are measured on the production build with the CPU slowed down.

Add `?lab` to the URL for the crayon test bench.

---

## The AI system

The sketchpad's **✨ ask** sends the sheet to `POST /api/ask`, which answers in a few seconds:

```
sketchpad  ──►  /api/ask  ──►  Grok ──► Gemini ──► Cloudflare Workers AI
 (typed notes +         (system prompt: rules + what the AI knows about me)
  a picture of the                     │
  handwriting)                         ▼
      ◄─────────── answers, placed on the sheet in crayon handwriting
```

**1. Reading the sheet** (`src/scribble/ai.ts`)
- Typed notes are sent as text.
- Handwritten strokes are grouped into pieces of writing by how close together they are; words on one
  line join up.
- The pieces go as a single picture, with a numbered box drawn round each one so the model can say which
  answer belongs where.
- Anything already answered isn't sent again.

**2. What it knows** (`server/ask-material.ts`), a small retrieval step with no database:
- **Sent with every question:** my CV, an about-me page, and the site's own data (roles, projects, skills).
- **Looked up per question:** each project's GitHub README and the blog posts. Sections are ranked by how
  many words they share with the question, rarer words counting more, and the best ones are added until
  the budget is full.
- **The rules** in `content/ai/rules.md`: only answer about me, keep it short, say so when it doesn't know.

**3. The models** (`server/ask.ts`)
- Each provider is tried in turn: xAI Grok, Google Gemini, then Cloudflare Workers AI (Mistral Small 3.1,
  which reads images). Whichever has a key set is used.
- A provider that refuses the key or runs out of allowance is skipped for 10 minutes.
- The whole request has a 9-second deadline. Visitors are limited to 6 questions a minute and 60 a day.
- Replies are strict JSON, checked and clipped before they reach the page.

**4. Writing the answer** (`src/scribble/answers.ts`)
- Answers are wrapped to fit and written in the crayon handwriting.
- Each one is placed in the nearest free space beside its question.
- If there's no room nearby, it goes further out with a curved arrow pointing to it.
- An answer and its arrow are one undo step.

It runs on free tiers. When the daily allowance runs out, visitors see "out of crayons" instead of a bill.
Setup: [docs/ai-setup.md](docs/ai-setup.md).

---

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build
```

Copy `.env.example` to `.env.local` for the optional parts:
- **The contact form:** see [docs/email-setup.md](docs/email-setup.md). Without it, messages print to the
  terminal.
- **The AI:** see [docs/ai-setup.md](docs/ai-setup.md). With `AI_PRACTICE=1`, the sketchpad gives practice
  answers, so you can try it without any key.

To try the AI endpoint on its own: `node scripts/ask-test.mjs` (with `npm run dev` running).

## Deploy

- **Netlify** (the live site): `netlify/functions/` serves `/api/ask` and `/api/contact`, and the keys are
  Netlify environment variables.
- **Docker:** `server/index.ts` is a small Node server for the site and both APIs. CI builds and pushes
  `ghcr.io/zidarc/portfolio:latest` on every push to `main`.

```bash
docker build -t portfolio .
docker run -p 8080:8080 --env-file .env.local portfolio   # http://localhost:8080
```

## Where things live

| Path | What |
|---|---|
| `src/crayon/` | the crayon engine: handwriting, doodles, shapes, wax texture |
| `src/sections/` | the landing page sections |
| `src/projects/` | the project boxes and their animated scenes |
| `src/scribble/` | scribble mode and the sketchpad, including the AI client (`ai.ts`, `answers.ts`) |
| `src/blog/`, `content/blog/` | the blog pages and posts |
| `src/data/` | roles, projects, skills and links: one source for the page and the AI |
| `server/` | the AI endpoint, its knowledge, the contact form, the blog build step, the Docker server |
| `content/ai/` | what the AI knows: CV, about-me, rules, repo notes |
| `netlify/functions/` | the same endpoints as Netlify Functions |
| `legacy/` | the previous HTML/CSS/jQuery version, kept for reference |

---

Made by Ali Hussain, in Karachi.
