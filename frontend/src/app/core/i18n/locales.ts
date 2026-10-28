import { DEPLOY_BASE } from '../build-env';

/** The locales the site is built for. Adding one means adding a build configuration. */
export type LocaleCode = 'de' | 'en';

/** German is first because it is the default the site redirects to. */
export interface Locale {
  /** BCP 47 code. Used for the URL prefix, the lang attribute and hreflang. */
  code: LocaleCode;
  /** What the switcher shows. */
  label: string;
  /** The language's own name, for people who cannot read the current one. */
  name: string;
}

export const LOCALES: readonly Locale[] = [
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'en', label: 'EN', name: 'English' },
];

export const DEFAULT_LOCALE: LocaleCode = 'de';

const CODES: readonly string[] = LOCALES.map((locale) => locale.code);

/**
 * Which build this is, resolved at compile time by the translation of this one id.
 * `LOCALE_ID` would need injection, and the route table is built at module scope
 * before any injector exists.
 */
export const CURRENT_LOCALE = $localize`:@@locale.code:en` as LocaleCode;

/** `en-US` and `en` both mean the English build. */
export const toLocaleCode = (localeId: string): LocaleCode =>
  localeId.split('-')[0] as LocaleCode;

/** The path with the deploy base and any locale prefix stripped off. */
export const unprefixed = (pathname: string): string => {
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
 * The same page in another language, as a real URL: each locale is a separate build.
 * It carries the deploy base because on GitHub Pages the site lives under a
 * repository sub-path, not at the domain root.
 *
 * `path` is already the counterpart locale's own path — slugs are translated, so the
 * caller resolves it from the route table rather than reusing the current one.
 */
export const localeHref = (path: string, code: LocaleCode): string =>
  DEPLOY_BASE + [code, path].filter(Boolean).join('/');
