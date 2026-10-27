import { DEFAULT_LOCALE } from './i18n/locales';

// Swap `origin` for the live domain before launch: canonical URLs, Open Graph tags,
// structured data and sitemap.xml all resolve against it, and search engines reject
// relative URLs in those places.
export const SITE = {
  origin: 'https://www.glanzwerk.de',
  name: 'Glanzwerk',
  title: $localize`:@@site.title:Glanzwerk | Cleaning, Moving & Property Services`,
  description: $localize`:@@site.description:More than cleaning. Glanzwerk handles home and commercial cleaning, moving, clearance, snow removal and property maintenance, including same-day and 24/7 call-outs.`,
  shareImage: 'assets/images/hero/hero-team.jpg',
} as const;

/**
 * Search engines and social crawlers need absolute URLs, and every locale is its own
 * set of pages, so the locale is part of the address rather than a runtime setting.
 */
export const absoluteUrl = (path: string, locale: string = DEFAULT_LOCALE): string => {
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return `${SITE.origin}/${[locale, trimmed].filter(Boolean).join('/')}`;
};
