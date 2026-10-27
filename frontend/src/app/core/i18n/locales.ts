import { DEPLOY_BASE } from '../build-env';

/** German is first because it is the default the site redirects to. */
export interface Locale {
  /** BCP 47 code. Used for the URL prefix, the lang attribute and hreflang. */
  code: string;
  /** What the switcher shows. */
  label: string;
  /** The language's own name, for people who cannot read the current one. */
  name: string;
}

export const LOCALES: readonly Locale[] = [
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'en', label: 'EN', name: 'English' },
];

export const DEFAULT_LOCALE = 'de';

const CODES = LOCALES.map((locale) => locale.code);

/** `en-US` and `en` both mean the English build. */
export const toLocaleCode = (localeId: string): string => localeId.split('-')[0];

/** The path with the deploy base and any locale prefix stripped off. */
const unprefixed = (pathname: string): string => {
  const withoutBase = pathname.startsWith(DEPLOY_BASE)
    ? pathname.slice(DEPLOY_BASE.length)
    : pathname;
  const segments = withoutBase
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .filter(Boolean);
  return (CODES.includes(segments[0]) ? segments.slice(1) : segments).join('/');
};

/**
 * The same page in another language. Each locale is a separate build, so this is a
 * real URL rather than a route, and it has to carry the deploy base: on GitHub Pages
 * the site lives under a repository sub-path, not at the domain root.
 */
export const localizedPath = (pathname: string, code: string): string =>
  DEPLOY_BASE + [code, unprefixed(pathname)].filter(Boolean).join('/');
