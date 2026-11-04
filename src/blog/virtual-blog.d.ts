/** Provided by server/vite-blog.ts. */
declare module 'virtual:blog' {
  import type { Post } from '../shared/blog.ts';
  export type PostMeta = Omit<Post, 'body'>;
  export const posts: PostMeta[];
  export const loaders: Record<string, () => Promise<{ default: (PostMeta & { html: string }) | null }>>;
}
