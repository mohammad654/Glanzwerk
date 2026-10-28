import { DOCUMENT, Injectable, LOCALE_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { DEFAULT_LOCALE, LOCALES, toLocaleCode } from '../i18n/locales';
import { localizedPathsFor } from '../routes';
import { SITE, absoluteUrl } from '../site';
import { resolvePageMeta } from './page-meta';
import { structuredDataFor } from './structured-data';

/** Only one JSON-LD block per page, so it is replaced rather than appended. */
const JSON_LD_ID = 'glanzwork-structured-data';

/** Marks the alternate-language links so they can be replaced wholesale. */
const ALTERNATE_ATTR = 'data-glanzwork-alternate';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  /** Each locale is its own build, so this is fixed at compile time. */
  private readonly locale = toLocaleCode(inject(LOCALE_ID));

  /** `url` is a router URL; query strings and fragments never change the metadata. */
  update(url: string): void {
    const path = url.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
    const page = resolvePageMeta(path);
    const canonical = absoluteUrl(path, this.locale);
    const image = absoluteUrl(page.image, this.locale);

    this.title.setTitle(page.title);

    this.setTags({
      description: page.description,
      // A canonical URL on a noindex page sends mixed signals, so the directive carries it.
      robots: page.indexable ? 'index, follow' : 'noindex, follow',
    });

    this.setProperties({
      'og:type': page.type,
      'og:site_name': SITE.name,
      'og:locale': this.locale,
      'og:title': page.title,
      'og:description': page.description,
      'og:url': canonical,
      'og:image': image,
    });

    this.setTags({
      'twitter:card': 'summary_large_image',
      'twitter:title': page.title,
      'twitter:description': page.description,
      'twitter:image': image,
    });

    this.setCanonical(page.indexable ? canonical : null);
    this.setAlternates(page.indexable ? path : null);
    this.setStructuredData(page.indexable ? structuredDataFor(path, this.locale) : null);
  }

  private setTags(tags: Record<string, string>): void {
    for (const [name, content] of Object.entries(tags)) {
      this.meta.updateTag({ name, content });
    }
  }

  // Open Graph uses `property`, not `name`; Facebook and LinkedIn ignore the other form.
  private setProperties(tags: Record<string, string>): void {
    for (const [property, content] of Object.entries(tags)) {
      this.meta.updateTag({ property, content }, `property="${property}"`);
    }
  }

  private setCanonical(href: string | null): void {
    const existing = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!href) {
      existing?.remove();
      return;
    }

    const link = existing ?? this.document.head.appendChild(this.document.createElement('link'));
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', href);
  }

  /**
   * Without these the two language versions compete as duplicates and the weaker one
   * is dropped. `x-default` names the locale an unmatched visitor should land on.
   */
  private setAlternates(path: string | null): void {
    for (const stale of this.document.head.querySelectorAll(`link[${ALTERNATE_ATTR}]`)) {
      stale.remove();
    }

    if (path === null) {
      return;
    }

    // Slugs are translated, so each locale needs its own path, not this one re-prefixed.
    const paths = localizedPathsFor(path);
    if (!paths) {
      return;
    }

    const alternates: { hreflang: string; href: string }[] = LOCALES.map((locale) => ({
      hreflang: locale.code,
      href: absoluteUrl(paths[locale.code], locale.code),
    }));
    alternates.push({
      hreflang: 'x-default',
      href: absoluteUrl(paths[DEFAULT_LOCALE], DEFAULT_LOCALE),
    });

    for (const { hreflang, href } of alternates) {
      const link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      link.setAttribute('href', href);
      link.setAttribute(ALTERNATE_ATTR, '');
      this.document.head.appendChild(link);
    }
  }

  private setStructuredData(data: object | null): void {
    const existing = this.document.getElementById(JSON_LD_ID);
    if (!data) {
      existing?.remove();
      return;
    }

    const script = existing ?? this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.id = JSON_LD_ID;
    script.textContent = JSON.stringify(data);
    if (!existing) {
      this.document.head.appendChild(script);
    }
  }
}
