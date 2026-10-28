import { BLOG_POSTS } from './blog-catalog';
import { LocalizedPath, linkTo, pathIn } from './i18n/localized-path';
import { PROJECTS } from './project-catalog';
import { SERVICES } from './service-catalog';

/**
 * Every page that is not generated from a content catalogue, keyed by a name that
 * does not change between locales. German is the money language — the paths follow
 * the URL plan in the Growth & SEO guide — so the keys stay English to keep them
 * readable next to the code that uses them.
 *
 * `scripts/generate-sitemap.mjs` reads this file as text, so keep one entry per line.
 */
export const STATIC_ROUTES = {
  home: { de: '', en: '' },
  about: { de: 'ueber-uns', en: 'about' },
  services: { de: 'leistungen', en: 'services' },
  serviceArea: { de: 'einsatzgebiet', en: 'service-area' },
  references: { de: 'referenzen', en: 'references' },
  blog: { de: 'ratgeber', en: 'blog' },
  jobs: { de: 'jobs', en: 'jobs' },
  contact: { de: 'kontakt', en: 'contact' },
  imprint: { de: 'impressum', en: 'imprint' },
  privacy: { de: 'datenschutz', en: 'privacy' },
  login: { de: 'login', en: 'login' },
} as const satisfies Record<string, LocalizedPath>;

export type StaticRouteKey = keyof typeof STATIC_ROUTES;

/**
 * Pages that exist for the law and for signed-in users, not for search. Germany
 * requires an Impressum and a Datenschutzerklärung, but neither should compete with
 * the service pages for attention in the index.
 */
export const UNLISTED_ROUTES: readonly StaticRouteKey[] = ['imprint', 'privacy', 'login'];

/**
 * Every page in the site, as its path in each locale.
 *
 * Slugs are translated, so a page cannot find its own counterpart by swapping the
 * URL's locale prefix. hreflang, the language switcher and the canonical tags all
 * resolve through here instead.
 */
const ALL_PATHS: readonly LocalizedPath[] = [
  ...Object.values(STATIC_ROUTES),
  ...SERVICES.map((service) => service.path),
  ...PROJECTS.map((project) => project.path),
  ...BLOG_POSTS.map((post) => post.path),
];

const BY_CURRENT_PATH = new Map(ALL_PATHS.map((path) => [pathIn(path), path]));

/** The same page in every locale, found by the URL this build serves it at. */
export const localizedPathsFor = (path: string): LocalizedPath | undefined =>
  BY_CURRENT_PATH.get(path);

/**
 * Ready-made router links for the static pages, so a template never spells a URL out.
 * A hardcoded "/contact" is simply wrong in the German build, where the page is
 * "/kontakt"; going through here makes that class of bug impossible.
 */
export const LINKS = Object.fromEntries(
  (Object.keys(STATIC_ROUTES) as StaticRouteKey[]).map((key) => [key, linkTo(STATIC_ROUTES[key])]),
) as Record<StaticRouteKey, string>;
