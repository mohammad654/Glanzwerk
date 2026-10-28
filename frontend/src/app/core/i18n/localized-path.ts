import { CURRENT_LOCALE, LocaleCode, localeHref } from './locales';

/**
 * A page's URL segment in every locale.
 *
 * Slugs are translated — `/de/winterdienst-dresden` is `/en/winter-service-dresden` —
 * so a page cannot find its counterpart by swapping the locale prefix. Carrying both
 * paths is what makes hreflang, the language switcher and the sitemap agree.
 */
export type LocalizedPath = Readonly<Record<LocaleCode, string>>;

/** This build's path for a page, without a leading slash. */
export const pathIn = (path: LocalizedPath): string => path[CURRENT_LOCALE];

/** This build's router link for a page. */
export const linkTo = (path: LocalizedPath): string => `/${pathIn(path)}`;

/** The page's absolute-from-root URL in another locale, for hreflang and the switcher. */
export const hrefIn = (path: LocalizedPath, locale: LocaleCode): string =>
  localeHref(path[locale], locale);
