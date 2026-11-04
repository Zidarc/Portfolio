# Writing a blog post

1. Copy `_template.md` to a new file named after the address you want: `how-recursion-hell-survived.md`
   becomes `/blog/how-recursion-hell-survived`. Lower-case words and dashes work best.
2. Fill in the header at the top (between the `---` lines) and write the post below it in Markdown.
3. Run `npm run dev` and open `http://localhost:5173/blog`. It reloads every time you save the file.
4. While `draft: true`, the post only shows in local dev (with a red "draft" stamp). Change it to
   `draft: false` (or delete the line) to publish it with the next deploy.

The header:

| field     | needed? | what it does                                                   |
|-----------|---------|----------------------------------------------------------------|
| `title`   | yes     | the post's title                                               |
| `date`    | yes     | `YYYY-MM-DD`; the list is newest first                         |
| `summary` | no      | one line shown under the title in the list of posts            |
| `tags`    | no      | `[backend, devday]`, shown as little crayon tags               |
| `draft`   | no      | `true` keeps it unpublished                                    |

In the post:

- Use `##` and `###` for headings (the title is already the page's main heading).
- Pictures: put them in `public/blog/` (WebP, resized to about 1400 px wide) and write
  `![what it shows](/blog/picture.webp)`. They show as taped-in photos.
- Links to other sites open in a new tab.
- `<!-- comments like this -->` are notes for you: they never show on the page and aren't read by the AI.

Published posts are also what the sketchpad's AI answers from (see `content/ai/README.md`), so a post
about a project makes the AI better at answering questions about it. Drafts are never sent to the AI.

Files starting with `_` (like `_template.md`) and this README are ignored.
