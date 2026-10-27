import { DEFAULT_LOCALE, LOCALES, localizedPath, toLocaleCode } from './locales';

describe('locales', () => {
  it('redirects to a locale that exists', () => {
    expect(LOCALES.map((locale) => locale.code)).toContain(DEFAULT_LOCALE);
  });

  it('reads the language out of a full locale id', () => {
    expect(toLocaleCode('en-US')).toBe('en');
    expect(toLocaleCode('de')).toBe('de');
  });

  it('swaps the locale prefix instead of stacking prefixes', () => {
    expect(localizedPath('/de/kontakt', 'en')).toBe('/en/kontakt');
    expect(localizedPath('/en/contact', 'de')).toBe('/de/contact');
  });

  it('adds a prefix to a path that has none', () => {
    expect(localizedPath('/contact', 'de')).toBe('/de/contact');
    expect(localizedPath('/services/home-cleaning', 'en')).toBe('/en/services/home-cleaning');
  });

  it('keeps the home page from becoming a bare slash', () => {
    expect(localizedPath('/', 'de')).toBe('/de');
    expect(localizedPath('/en', 'de')).toBe('/de');
  });
});
