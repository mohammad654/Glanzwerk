import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';

import { SERVICES } from '../service-catalog';
import { DEFAULT_LOCALE, LOCALES } from '../i18n/locales';
import { absoluteUrl } from '../site';
import { resolvePageMeta } from './page-meta';
import { provideSeo } from './provide-seo';
import { SeoService } from './seo.service';
import { structuredDataFor } from './structured-data';

const metaContent = (selector: string): string | null =>
  document.head.querySelector(selector)?.getAttribute('content') ?? null;

describe('page meta', () => {
  it('describes every service page from the catalogue', () => {
    for (const service of SERVICES) {
      const meta = resolvePageMeta(`services/${service.slug}`);
      expect(meta.title).toBe(service.metaTitle);
      expect(meta.indexable).toBe(true);
      // Google truncates past roughly these lengths.
      expect(meta.title.length).toBeLessThanOrEqual(70);
      expect(meta.description.length).toBeLessThanOrEqual(170);
    }
  });

  it('keeps unknown and placeholder pages out of the index', () => {
    expect(resolvePageMeta('services/does-not-exist').indexable).toBe(false);
    expect(resolvePageMeta('login').indexable).toBe(false);
  });
});

describe('structured data', () => {
  it('adds a Service node that points back at the business', () => {
    const graph = structuredDataFor(`services/${SERVICES[0].slug}`, 'de')['@graph'] as Record<
      string,
      unknown
    >[];
    const types = graph.map((node) => node['@type']);

    expect(types).toContain('LocalBusiness');
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('Service');
  });
});

describe('SeoService', () => {
  it('writes the title, canonical URL and share tags for a route', () => {
    const seo = TestBed.inject(SeoService);
    const service = SERVICES[0];

    seo.update(`/services/${service.slug}?utm_source=test`);

    expect(document.title).toBe(service.metaTitle);
    expect(metaContent('meta[name="description"]')).toBe(service.metaDescription);
    expect(metaContent('meta[property="og:title"]')).toBe(service.metaTitle);
    expect(metaContent('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      absoluteUrl(`services/${service.slug}`, 'en'),
    );
  });

  it('points every language at the same page, plus an x-default', () => {
    const seo = TestBed.inject(SeoService);

    seo.update('/contact');

    const alternates = [...document.head.querySelectorAll('link[rel="alternate"]')].map((link) => [
      link.getAttribute('hreflang'),
      link.getAttribute('href'),
    ]);

    for (const locale of LOCALES) {
      expect(alternates).toContainEqual([locale.code, absoluteUrl('contact', locale.code)]);
    }
    // Without x-default, a visitor Google cannot place has no stated landing page.
    expect(alternates).toContainEqual(['x-default', absoluteUrl('contact', DEFAULT_LOCALE)]);
  });

  it('drops the canonical URL and structured data on a noindex route', () => {
    const seo = TestBed.inject(SeoService);

    seo.update('/login');

    expect(metaContent('meta[name="robots"]')).toBe('noindex, follow');
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('link[rel="alternate"]')).toBeNull();
    expect(document.getElementById('glanzwerk-structured-data')).toBeNull();
  });
});

describe('provideSeo', () => {
  it('updates the metadata on navigation', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'about', children: [] }]),
        provideLocationMocks(),
        provideSeo(),
      ],
    });

    await TestBed.inject(Router).navigateByUrl('/about');

    expect(document.title).toBe(resolvePageMeta('about').title);
  });
});
