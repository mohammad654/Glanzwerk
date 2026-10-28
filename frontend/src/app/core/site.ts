import { SITE_ORIGIN } from './build-env';
import { DEFAULT_LOCALE } from './i18n/locales';

// Swap `origin` for the live domain before launch: canonical URLs, Open Graph tags,
// structured data and sitemap.xml all resolve against it, and search engines reject
// relative URLs in those places.
export const SITE = {
  origin: SITE_ORIGIN,
  name: 'Glanzwork',
  title: $localize`:@@site.title:Cleaning Company in Dresden | Glanzwork Facility Services`,
  description: $localize`:@@site.description:Commercial and office cleaning, winter service and gardening in Dresden. English-speaking contact, fixed teams, documented quality. Request a free quote.`,
  shareImage: 'assets/images/hero/glanzwork-team-dresden.webp',
} as const;

/**
 * Search engines and social crawlers need absolute URLs, and every locale is its own
 * set of pages, so the locale is part of the address rather than a runtime setting.
 */
export const absoluteUrl = (path: string, locale: string = DEFAULT_LOCALE): string => {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return `${SITE.origin}/${[locale, trimmed].filter(Boolean).join('/')}`;
};
