import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Every route in `app.routes.ts` is now a concrete path — service, reference and
 * advice pages are generated from the catalogues rather than matched by a `:slug`
 * parameter — so there is nothing left for `getPrerenderParams` to supply.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
