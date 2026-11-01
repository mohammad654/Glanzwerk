// Replaced at build time by `ng build --define`. The defaults suit local work and
// the production domain; GitHub Pages serves from a repository sub-path and a
// different origin, so the deploy workflow overrides both.
//
// `typeof` rather than a bare reference: when nothing defines them, as in tests,
// reading the identifier directly throws a ReferenceError.
declare const NG_SITE_ORIGIN: string | undefined;
declare const NG_DEPLOY_BASE: string | undefined;
declare const NG_API_BASE_URL: string | undefined;

/** Origin used for canonical URLs, hreflang, Open Graph and structured data. */
export const SITE_ORIGIN =
  typeof NG_SITE_ORIGIN === 'string' ? NG_SITE_ORIGIN : 'https://www.glanzwerk.de';

/** Path the app is served under, with both slashes: '/' or '/Glanzwork/'. */
export const DEPLOY_BASE = typeof NG_DEPLOY_BASE === 'string' ? NG_DEPLOY_BASE : '/';

/**
 * Where the Spring API lives.
 *
 * Relative by default, so the browser calls the same origin the page came from and
 * there is no CORS preflight and no cookie to mark cross-site. In development
 * `proxy.conf.json` forwards `/api` to port 8081; in production the static host does
 * the same rewrite, exactly as it already does for `/` -> `/de/`. An API on another
 * origin is a matter of defining this to an absolute URL at build time — and adding
 * that origin to `glanzwerk.cors.allowed-origins` on the backend.
 */
export const API_BASE_URL = typeof NG_API_BASE_URL === 'string' ? NG_API_BASE_URL : '/api/v1';
