# What the sketchpad's AI knows

The AI mode on `/draw` answers from here (read by `server/ask-material.ts`):

- **`rules.md`**: how it behaves (what it may answer, tone, length). Currently a placeholder.
- **Markdown files at the top of this folder** (`cv.md`, `about.md`, …): sent with **every** question.
  Keep these to the essentials.
- **`repos/`**: each project repo's README and GitHub details, made by
  `node scripts/fetch-repo-notes.mjs` (re-run it when the repos change). **Looked up** per question.
- **`../blog/`**: blog posts, one Markdown file each. **Looked up** per question too, so the blog and the AI
  share one source.
- **The site's own data** is always included automatically: roles, projects, skills and links from
  `src/data/`, so those never need copying here.

"Looked up": while everything fits in about 60,000 characters it is all sent. Past that, the sections
that share the most words with the question are sent, and the rest are listed by title.

Everything here can be sent to the AI provider with a question, so keep it to things you're happy for
visitors to be told. HTML comments (`<!-- like this -->`) are notes for you and are never sent. Changes go
live with the next deploy.

Setup and testing: `docs/ai-setup.md`.
