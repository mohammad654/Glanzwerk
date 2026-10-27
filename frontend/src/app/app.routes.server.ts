import { RenderMode, ServerRoute } from '@angular/ssr';

import { BLOG_POSTS } from './core/blog-catalog';
import { PROJECTS } from './core/project-catalog';
import { SERVICES } from './core/service-catalog';

/** Prerender needs the slug list up front; the catalogues are the only source. */
const slugs = (values: readonly { slug: string }[]) => async () =>
  values.map(({ slug }) => ({ slug }));

export const serverRoutes: ServerRoute[] = [
  {
    path: 'services/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: slugs(SERVICES),
  },
  {
    path: 'projects/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: slugs(PROJECTS),
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: slugs(BLOG_POSTS),
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
