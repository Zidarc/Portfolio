# What the sketchpad's AI knows

The AI mode on `/draw` answers from here (read by `server/ask-material.ts`):

- **`rules.md`**: how it behaves (what it may answer, tone, length).
- **`faq.md`**: short answers to common questions, used only when every AI provider is down. Not sent
  to the AI.
- **`embeddings.json`**: the meaning of each looked-up section, made by `node scripts/embed-content.ts`.
  Re-run it after changing `repos/` or the blog.
- **Markdown files at the top of this folder** (`cv.md`, `about.md`, …): sent with **every** question.
  Keep these to the essentials.
- **To find out what to add:** `node scripts/ask-log.mjs` ends with the questions it had no notes for.
- **`repos/`**: each project repo's README and GitHub details, made by
  `node scripts/fetch-repo-notes.mjs` (re-run it when the repos change). **Looked up** per question.
- **`../blog/`**: blog posts, one Markdown file each. **Looked up** per question too, so the blog and the AI
  share one source.
- **The site's own data** is always included automatically: roles, projects, skills and links from
  `src/data/`, so those never need copying here.

"Looked up": while everything fits it is all sent (about 60,000 characters; Cloudflare's model gets
24,000). Past that, the sections that best match the question, by words and by meaning, are sent, and the
rest are listed by title.

Everything here can be sent to the AI provider with a question, so keep it to things you're happy for
visitors to be told. HTML comments (`<!-- like this -->`) are notes for you and are never sent. Changes go
live with the next deploy.

Setup and testing: `docs/ai-setup.md`.
