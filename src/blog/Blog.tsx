import { useEffect, useState, type ReactNode } from 'react';
import { loaders, posts, type PostMeta } from 'virtual:blog';
import { CrayonCursor } from '../components/CrayonCursor.tsx';
import { ThemeButton } from '../components/ThemeButton.tsx';
import { CrayonDoodle } from '../crayon/CrayonDoodle.tsx';
import { CrayonText } from '../crayon/CrayonText.tsx';
import { useMediaQuery } from '../hooks/useMediaQuery.ts';
import { formatDate } from '../shared/blog.ts';
import './blog.css';

/** "/blog" (or "/blog.html") is the list; "/blog/<slug>" is one post. */
const slug = decodeURIComponent(window.location.pathname.replace(/^\/blog(\.html)?\/?/, '').replace(/\/+$/, ''));

/** The blog: /blog lists the posts (content/blog/, see src/shared/blog.ts), /blog/<slug> shows one. */
export function Blog() {
  return (
    <>
      {slug ? <PostPage slug={slug} /> : <ListPage />}
      <CrayonCursor />
    </>
  );
}

/** The strip along the top: back to the site (or the list) and the theme button. */
function Shell({ back, children }: { back: { href: string; label: string }; children: ReactNode }) {
  return (
    <div className="blog">
      <header className="blog__top">
        <a className="blog__back" href={back.href}>
          ← {back.label}
        </a>
        <ThemeButton className="blog__theme" />
      </header>
      <main className="blog__page">{children}</main>
      <footer className="blog__footer">
        <a href="/">Ali Hussain</a> · <a href="/blog">all posts</a> · <a href="/draw">sketchpad</a>
      </footer>
    </div>
  );
}

const Stamp = () => <span className="blog__draft">draft</span>;

function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <ul className="blog__tags" aria-label="Tags">
      {tags.map((t) => (
        <li key={t} className="chip">
          {t}
        </li>
      ))}
    </ul>
  );
}

function ListPage() {
  const narrow = useMediaQuery('(max-width: 600px)');
  useEffect(() => {
    document.title = 'Blog · Ali Hussain';
  }, []);

  return (
    <Shell back={{ href: '/', label: "back to Ali's site" }}>
      <h1 className="blog__heading">
        <span className="sr-only">Blog</span>
        <CrayonText text="Blog" decorative capHeight={narrow ? 36 : 48} tempo={1.3} color="var(--crayon-purple)" />
      </h1>
      <p className="blog__intro">Notes on backend, systems and the things I build, written as I go.</p>

      {posts.length ? (
        <ol className="blog-list">
          {posts.map((p) => (
            <li key={p.slug}>
              <PostCard post={p} />
            </li>
          ))}
        </ol>
      ) : (
        <div className="blog__empty">
          <span className="blog__empty-doodle">
            <CrayonDoodle name="bulb" decorative color="var(--crayon-yellow)" />
          </span>
          <p>Nothing here yet. The first post is on its way.</p>
        </div>
      )}
    </Shell>
  );
}

function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="blog-card">
      <p className="blog-card__date">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        {post.draft && <Stamp />}
      </p>
      <h2 className="blog-card__title">
        <a href={`/blog/${post.slug}`}>{post.title}</a>
      </h2>
      {post.summary && <p className="blog-card__summary">{post.summary}</p>}
      <Tags tags={post.tags} />
    </article>
  );
}

type Loaded = (PostMeta & { html: string }) | null;

function PostPage({ slug }: { slug: string }) {
  const [post, setPost] = useState<Loaded | undefined>(undefined);

  useEffect(() => {
    const load = loaders[slug];
    if (!load) return setPost(null);
    load()
      .then((m) => setPost(m.default))
      .catch(() => setPost(null));
  }, [slug]);

  useEffect(() => {
    if (post) document.title = `${post.title} · Ali Hussain`;
    if (post === null) document.title = 'Post not found · Ali Hussain';
  }, [post]);

  return (
    <Shell back={{ href: '/blog', label: 'all posts' }}>
      {post === undefined ? null : post === null ? (
        <div className="blog__empty">
          <h1 className="blog-post__title">This page has been rubbed out</h1>
          <p>
            There's no post at this address. <a href="/blog">See all the posts</a>.
          </p>
        </div>
      ) : (
        <article className="blog-post">
          <header className="blog-post__head">
            <h1 className="blog-post__title">{post.title}</h1>
            <span className="blog-post__underline">
              <CrayonDoodle name="underline" decorative weight={0.05} tempo={1.4} color="var(--crayon-purple)" />
            </span>
            <p className="blog-card__date">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.draft && <Stamp />}
            </p>
            <Tags tags={post.tags} />
          </header>
          {/* the post's Markdown, turned into HTML at build time (server/vite-blog.ts) */}
          <div className="blog-post__body prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>
      )}
    </Shell>
  );
}
