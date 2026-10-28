import { findPostByPath } from '../blog-catalog';
import { COMPANY, SOCIAL_LINKS } from '../company';
import { LocaleCode } from '../i18n/locales';
import { pathIn } from '../i18n/localized-path';
import { flattenNavItems, trailFor } from '../navigation';
import { findProjectByPath } from '../project-catalog';
import { SERVICES, findServiceByPath } from '../service-catalog';
import { faqsFor } from '../service-faqs';
import { SITE, absoluteUrl } from '../site';

/** A JSON-LD node. Shapes vary by @type, so this stays deliberately loose. */
type Schema = Record<string, unknown>;

const businessId = (locale: LocaleCode) => `${absoluteUrl('', locale)}#business`;

/** Every town in the Einsatzgebiet, as the Place nodes schema.org expects. */
const areaServed = COMPANY.areaServed.map((name) => ({ '@type': 'Place', name }));

/**
 * The LocalBusiness node every page carries. Local search results — the map pack in
 * particular — are built from name, address, phone and opening hours, so this is the
 * one piece of markup that directly affects whether a nearby customer finds us.
 *
 * The type stays `LocalBusiness`: schema.org has no `CleaningService` type, and an
 * invented @type makes the whole node invalid rather than more specific.
 */
const localBusiness = (locale: LocaleCode): Schema => ({
  '@type': 'LocalBusiness',
  '@id': businessId(locale),
  name: COMPANY.name,
  url: absoluteUrl('', locale),
  image: absoluteUrl(SITE.shareImage, locale),
  description: SITE.description,
  // Dialable form: schema.org wants the number reachable from abroad, not the local one.
  telephone: COMPANY.phoneHref,
  email: COMPANY.email,
  founder: { '@type': 'Person', name: COMPANY.founder },
  knowsLanguage: COMPANY.languages,
  address: {
    '@type': 'PostalAddress',
    streetAddress: COMPANY.address.street,
    postalCode: COMPANY.address.postalCode,
    addressLocality: COMPANY.address.city,
    addressRegion: COMPANY.address.region,
    addressCountry: COMPANY.address.country,
  },
  areaServed,
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: COMPANY.openingHoursSpec.days,
    opens: COMPANY.openingHoursSpec.opens,
    closes: COMPANY.openingHoursSpec.closes,
  },
  sameAs: SOCIAL_LINKS.map((social) => social.url),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: `${COMPANY.name} Services`,
    itemListElement: SERVICES.map((service) => ({
      '@type': 'Offer',
      url: absoluteUrl(service.path[locale], locale),
      itemOffered: { '@type': 'Service', name: service.title },
    })),
  },
});

/** What a page calls itself in a breadcrumb — its own title, not its slug. */
const pageName = (path: string): string => {
  const service = findServiceByPath(path);
  if (service) {
    return service.title;
  }

  const project = findProjectByPath(path);
  if (project) {
    return project.title;
  }

  const post = findPostByPath(path);
  if (post) {
    return post.title;
  }

  return flattenNavItems().find((item) => pathIn(item.path) === path)?.label ?? path;
};

/**
 * The trail comes from the menu tree, not from the URL's segments: service pages sit
 * at the site root for SEO but still belong under Services for a reader.
 */
const breadcrumbs = (path: string, locale: LocaleCode): Schema | undefined => {
  if (!path) {
    return undefined;
  }

  const crumbs = [
    { name: SITE.name, item: absoluteUrl('', locale) },
    ...trailFor(path).map((crumb) => ({
      name: crumb.label,
      item: absoluteUrl(crumb.path, locale),
    })),
    { name: pageName(path), item: absoluteUrl(path, locale) },
  ];

  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      ...crumb,
    })),
  };
};

const pageSchema = (path: string, locale: LocaleCode): Schema | undefined => {
  const service = findServiceByPath(path);
  if (service) {
    return {
      '@type': 'Service',
      name: service.title,
      description: service.metaDescription,
      serviceType: service.title,
      url: absoluteUrl(path, locale),
      image: absoluteUrl(service.image, locale),
      provider: { '@id': businessId(locale) },
      areaServed,
    };
  }

  const post = findPostByPath(path);
  if (post) {
    return {
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url: absoluteUrl(path, locale),
      image: absoluteUrl(post.image, locale),
      datePublished: new Date(post.date).toISOString().slice(0, 10),
      author: { '@type': 'Organization', name: post.author },
      publisher: { '@id': businessId(locale) },
    };
  }

  return undefined;
};

/**
 * The page's questions and answers, where it has any. This is the node that can turn
 * a result into an expandable one, so it carries the answers verbatim: markup that
 * does not match what the visitor reads is a manual-action risk, not a clever trick.
 */
const faqPage = (path: string): Schema | undefined => {
  const service = findServiceByPath(path);
  const faqs = service ? faqsFor(service.key) : [];
  if (faqs.length === 0) {
    return undefined;
  }

  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
};

/** One @graph per page: the business, the breadcrumb trail, and the page's own nodes. */
export const structuredDataFor = (path: string, locale: LocaleCode): Schema => ({
  '@context': 'https://schema.org',
  '@graph': [
    localBusiness(locale),
    breadcrumbs(path, locale),
    pageSchema(path, locale),
    faqPage(path),
  ].filter((node): node is Schema => node !== undefined),
});
