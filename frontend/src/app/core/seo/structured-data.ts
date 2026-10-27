import { BLOG_POSTS, blogPath } from '../blog-catalog';
import { PROJECTS, projectPath } from '../project-catalog';
import { ADDRESS_LINE, COMPANY, SOCIAL_LINKS } from '../company';
import { SERVICES, servicePath } from '../service-catalog';
import { SITE, absoluteUrl } from '../site';

/** A JSON-LD node. Shapes vary by @type, so this stays deliberately loose. */
type Schema = Record<string, unknown>;

const businessId = (locale: string) => `${absoluteUrl('', locale)}#business`;

/**
 * The LocalBusiness node every page carries. Local search results — the map pack in
 * particular — are built from name, address, phone and opening hours, so this is the
 * one piece of markup that directly affects whether a nearby customer finds us.
 */
const localBusiness = (locale: string): Schema => ({
  '@type': 'LocalBusiness',
  '@id': businessId(locale),
  name: COMPANY.name,
  url: absoluteUrl('', locale),
  image: absoluteUrl(SITE.shareImage, locale),
  description: SITE.description,
  telephone: COMPANY.phone,
  email: COMPANY.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: COMPANY.address.street,
    postalCode: COMPANY.address.postalCode,
    addressLocality: COMPANY.address.city,
    addressCountry: COMPANY.address.country,
  },
  areaServed: { '@type': 'Place', name: COMPANY.areaServed },
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
      url: absoluteUrl(servicePath(service.slug), locale),
      itemOffered: { '@type': 'Service', name: service.title },
    })),
  },
});

const titleCase = (segment: string): string =>
  segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** Breadcrumb labels read better from the catalogs than from the slug. */
const crumbLabel = (path: string): string => {
  const service = SERVICES.find((item) => servicePath(item.slug) === path);
  const project = PROJECTS.find((item) => projectPath(item.slug) === path);
  const post = BLOG_POSTS.find((item) => blogPath(item.slug) === path);
  return service?.title ?? project?.title ?? post?.title ?? titleCase(path.split('/').pop() ?? '');
};

const breadcrumbs = (path: string, locale: string): Schema | undefined => {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) {
    return undefined;
  }

  const trail = segments.map((_, index) => segments.slice(0, index + 1).join('/'));
  return {
    '@type': 'BreadcrumbList',
    itemListElement: ['', ...trail].map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb === '' ? SITE.name : crumbLabel(crumb),
      item: absoluteUrl(crumb, locale),
    })),
  };
};

const pageSchema = (path: string, locale: string): Schema | undefined => {
  const service = SERVICES.find((item) => servicePath(item.slug) === path);
  if (service) {
    return {
      '@type': 'Service',
      name: service.title,
      description: service.metaDescription,
      serviceType: service.title,
      url: absoluteUrl(path, locale),
      image: absoluteUrl(service.image, locale),
      provider: { '@id': businessId(locale) },
      areaServed: { '@type': 'Place', name: COMPANY.areaServed },
    };
  }

  const post = BLOG_POSTS.find((item) => blogPath(item.slug) === path);
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

/** One @graph per page: the business, the breadcrumb trail, and the page's own node. */
export const structuredDataFor = (path: string, locale: string): Schema => ({
  '@context': 'https://schema.org',
  '@graph': [localBusiness(locale), breadcrumbs(path, locale), pageSchema(path, locale)].filter(
    (node): node is Schema => node !== undefined,
  ),
});
