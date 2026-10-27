// Replaced at build time by `ng build --define`. The defaults suit local work and
// the production domain; GitHub Pages serves from a repository sub-path and a
// different origin, so the deploy workflow overrides both.
//
// `typeof` rather than a bare reference: when nothing defines them, as in tests,
// reading the identifier directly throws a ReferenceError.
declare const NG_SITE_ORIGIN: string | undefined;
declare const NG_DEPLOY_BASE: string | undefined;

/** Origin used for canonical URLs, hreflang, Open Graph and structured data. */
export const SITE_ORIGIN =
  typeof NG_SITE_ORIGIN === 'string' ? NG_SITE_ORIGIN : 'https://www.glanzwerk.de';

/** Path the app is served under, with both slashes: '/' or '/Glanzwerk/'. */
export const DEPLOY_BASE = typeof NG_DEPLOY_BASE === 'string' ? NG_DEPLOY_BASE : '/';
