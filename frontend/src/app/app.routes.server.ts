import { RenderMode, ServerRoute } from '@angular/ssr';

import { STATIC_ROUTES } from './core/routes';
import { pathIn } from './core/i18n/localized-path';

/**
 * How each route is produced at build time.
 *
 * `outputMode` is `"static"`, so there is no Node server: every route is either
 * prerendered to HTML or shipped as a client-rendered shell. The marketing pages are
 * prerendered, which is the whole point of the SEO work. The pages behind a sign-in
 * are not, for three reasons:
 *
 *   - There is nothing to prerender. Their content comes from the API, which does not
 *     exist during the build, so the HTML would be an empty frame either way.
 *   - Prerendering them would publish that frame. The dashboard used to ship with
 *     demo client records baked into the static output, readable by anyone who found
 *     the URL. A client-rendered shell cannot leak data it never had.
 *   - They are `noindex` anyway (see `UNLISTED_ROUTES`), so there is no search value
 *     to give up.
 *
 * The host still has to serve these paths — the SPA fallback in the hosting contract
 * already does, and `scripts/preview.mjs` is the reference for it.
 */
const clientRendered = (path: string): ServerRoute => ({
  path,
  renderMode: RenderMode.Client,
});

export const serverRoutes: ServerRoute[] = [
  // The whole dashboard subtree, in one rule.
  clientRendered(`${pathIn(STATIC_ROUTES.admin)}/**`),
  clientRendered(pathIn(STATIC_ROUTES.admin)),
  clientRendered(pathIn(STATIC_ROUTES.login)),
  clientRendered(pathIn(STATIC_ROUTES.register)),
  clientRendered(pathIn(STATIC_ROUTES.forgotPassword)),
  clientRendered(pathIn(STATIC_ROUTES.resetPassword)),
  clientRendered(pathIn(STATIC_ROUTES.account)),
  clientRendered(pathIn(STATIC_ROUTES.booking)),

  // Everything else is a concrete path in `app.routes.ts`, generated from the
  // catalogues, so there is nothing left for `getPrerenderParams` to supply.
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
