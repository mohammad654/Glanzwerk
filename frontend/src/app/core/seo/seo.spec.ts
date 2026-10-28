import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';

import { DEFAULT_LOCALE, LOCALES } from '../i18n/locales';
import { STATIC_ROUTES } from '../routes';
import { SERVICES, servicePath } from '../service-catalog';
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
      const meta = resolvePageMeta(servicePath(service));
      expect(meta.title).toBe(service.metaTitle);
      expect(meta.indexable).toBe(true);
      // Google truncates past roughly these lengths.
      expect(meta.title.length).toBeLessThanOrEqual(70);
      expect(meta.description.length).toBeLessThanOrEqual(170);
    }
  });

  it('keeps unknown, placeholder and legal pages out of the index', () => {
    expect(resolvePageMeta('does-not-exist').indexable).toBe(false);
    expect(resolvePageMeta(STATIC_ROUTES.login.en).indexable).toBe(false);
    expect(resolvePageMeta(STATIC_ROUTES.imprint.en).indexable).toBe(false);
    expect(resolvePageMeta(STATIC_ROUTES.jobs.en).indexable).toBe(false);
  });
});

describe('structured data', () => {
  it('adds a Service node that points back at the business', () => {
    const graph = structuredDataFor(servicePath(SERVICES[0]), 'de')['@graph'] as Record<
      string,
      unknown
    >[];
    const types = graph.map((node) => node['@type']);

    expect(types).toContain('LocalBusiness');
    expect(types).toContain('BreadcrumbList');
    expect(types).toContain('Service');
  });

  it('puts a root-level service page under Services in the breadcrumb trail', () => {
    const graph = structuredDataFor(servicePath(SERVICES[0]), 'en')['@graph'] as Record<
      string,
      unknown
    >[];
    const crumbs = graph.find((node) => node['@type'] === 'BreadcrumbList');
    const names = (crumbs?.['itemListElement'] as { name: string }[]).map((item) => item.name);

    expect(names).toEqual(['Glanzwork', 'Services', SERVICES[0].title]);
  });
});

describe('SeoService', () => {
  it('writes the title, canonical URL and share tags for a route', () => {
    const seo = TestBed.inject(SeoService);
    const service = SERVICES[0];

    seo.update(`/${servicePath(service)}?utm_source=test`);

    expect(document.title).toBe(service.metaTitle);
    expect(metaContent('meta[name="description"]')).toBe(service.metaDescription);
    expect(metaContent('meta[property="og:title"]')).toBe(service.metaTitle);
    expect(metaContent('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      absoluteUrl(servicePath(service), 'en'),
    );
  });

  it('points each language at its own translated URL, plus an x-default', () => {
    const seo = TestBed.inject(SeoService);

    seo.update(`/${STATIC_ROUTES.contact.en}`);

    const alternates = [...document.head.querySelectorAll('link[rel="alternate"]')].map((link) => [
      link.getAttribute('hreflang'),
      link.getAttribute('href'),
    ]);

    // The German page is /de/kontakt, not /de/contact: swapping the prefix is not enough.
    for (const locale of LOCALES) {
      expect(alternates).toContainEqual([
        locale.code,
        absoluteUrl(STATIC_ROUTES.contact[locale.code], locale.code),
      ]);
    }
    expect(alternates).toContainEqual([
      'x-default',
      absoluteUrl(STATIC_ROUTES.contact[DEFAULT_LOCALE], DEFAULT_LOCALE),
    ]);
  });

  it('drops the canonical URL and structured data on a noindex route', () => {
    const seo = TestBed.inject(SeoService);

    seo.update(`/${STATIC_ROUTES.login.en}`);

    expect(metaContent('meta[name="robots"]')).toBe('noindex, follow');
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('link[rel="alternate"]')).toBeNull();
    expect(document.getElementById('glanzwork-structured-data')).toBeNull();
  });
});

describe('provideSeo', () => {
  it('updates the metadata on navigation', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: STATIC_ROUTES.about.en, children: [] }]),
        provideLocationMocks(),
        provideSeo(),
      ],
    });

    await TestBed.inject(Router).navigateByUrl(`/${STATIC_ROUTES.about.en}`);

    expect(document.title).toBe(resolvePageMeta(STATIC_ROUTES.about.en).title);
  });
});
