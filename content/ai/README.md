# What the sketchpad's AI knows

The AI mode on `/draw` answers from this folder (read by `server/ask-material.ts`):

- **`rules.md`**: how it behaves (what it may answer, tone, length). Currently a placeholder.
- **Every other `.md` file** (except this README): material it answers from, e.g. `cv.md`,
  `blog-<topic>.md`. Plain Markdown; one file per document.
- **The site's own data** is always included automatically: roles, projects, skills and links from
  `src/data/`, so those never need copying here.

Everything here is sent to the AI provider with each question, so keep it to things you're happy for
visitors to be told. Changes go live with the next deploy.

Setup and testing: `docs/ai-setup.md`.
