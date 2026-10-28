import { STATIC_ROUTES, localizedPathsFor } from '../routes';
import { SERVICES } from '../service-catalog';
import { DEFAULT_LOCALE, LOCALES, localeHref, toLocaleCode, unprefixed } from './locales';

describe('locales', () => {
  it('redirects to a locale that exists', () => {
    expect(LOCALES.map((locale) => locale.code)).toContain(DEFAULT_LOCALE);
  });

  it('reads the language out of a full locale id', () => {
    expect(toLocaleCode('en-US')).toBe('en');
    expect(toLocaleCode('de')).toBe('de');
  });

  it('strips a locale prefix without stripping a real first segment', () => {
    expect(unprefixed('/de/kontakt')).toBe('kontakt');
    expect(unprefixed('/en/contact')).toBe('contact');
    expect(unprefixed('/contact')).toBe('contact');
    expect(unprefixed('/')).toBe('');
  });

  it('builds a locale URL without stacking or dropping prefixes', () => {
    expect(localeHref('kontakt', 'de')).toBe('/de/kontakt');
    expect(localeHref('', 'de')).toBe('/de');
  });
});

describe('cross-locale paths', () => {
  it('pairs a page with its translated counterpart, not its own path re-prefixed', () => {
    const paths = localizedPathsFor(STATIC_ROUTES.contact.en);

    expect(paths?.de).toBe('kontakt');
    expect(paths?.en).toBe('contact');
  });

  it('knows every service page in both locales', () => {
    for (const service of SERVICES) {
      expect(localizedPathsFor(service.path.en)).toEqual(service.path);
    }
  });

  it('gives each locale a distinct slug, so hreflang pairs cannot collapse', () => {
    for (const service of SERVICES) {
      expect(service.path.de).not.toBe(service.path.en);
    }
  });

  it('never issues the same URL to two pages', () => {
    const all = [
      ...Object.values(STATIC_ROUTES),
      ...SERVICES.map((service) => service.path),
    ].flatMap((path) => [`de/${path.de}`, `en/${path.en}`]);

    expect(new Set(all).size).toBe(all.length);
  });
});
