import { BLOG_POSTS, findPostByPath } from '../blog-catalog';
import { pathIn } from '../i18n/localized-path';
import { PROJECTS, findProjectByPath } from '../project-catalog';
import { STATIC_ROUTES, StaticRouteKey, UNLISTED_ROUTES } from '../routes';
import { SERVICES, findServiceByPath } from '../service-catalog';
import { SITE } from '../site';

export interface PageMeta {
  title: string;
  description: string;
  /** Relative path; absolute share URLs are built by the SEO service. */
  image: string;
  type: 'website' | 'article';
  /** Pages that are still placeholders stay out of the index until they hold real content. */
  indexable: boolean;
}

const page = (title: string, description: string, overrides: Partial<PageMeta> = {}): PageMeta => ({
  title,
  description,
  image: SITE.shareImage,
  type: 'website',
  indexable: true,
  ...overrides,
});

/** Keyed by route key so the German and English URLs share one definition. */
const STATIC_META: Readonly<Record<StaticRouteKey, PageMeta>> = {
  home: page(SITE.title, SITE.description),
  about: page(
    $localize`:@@meta.about.title:About Glanzwork | Your Cleaning Company in Dresden`,
    $localize`:@@meta.about.description:A Dresden family business for cleaning, winter service and grounds care. Directly employed staff, a named contact person and prices agreed in writing.`,
  ),
  services: page(
    $localize`:@@meta.services.title:Our Services | Building Cleaning Dresden | Glanzwork`,
    $localize`:@@meta.services.description:Maintenance, office, school, medical, public sector and industrial cleaning, glass, winter service, grounds care and caretaking — all from one provider in Dresden.`,
  ),
  references: page(
    $localize`:@@meta.references.title:References | Cleaning Projects in Dresden | Glanzwork`,
    $localize`:@@meta.references.description:Real contracts we run in and around Dresden: offices, schools, clinics, facades and winter service, with the scope and schedule behind each one.`,
  ),
  blog: page(
    $localize`:@@meta.blog.title:Advice on Cleaning & Property Care | Glanzwork`,
    $localize`:@@meta.blog.description:Practical guidance on cleaning intervals, written specifications and post-construction handover, from the team in Dresden that does the work.`,
  ),
  contact: page(
    $localize`:@@meta.contact.title:Contact Glanzwork Dresden | Request A Free Quote`,
    $localize`:@@meta.contact.description:Tell us what you need and we come back with a fixed written price. Free site visit in Dresden and the surrounding area. Call, email or send an enquiry.`,
  ),
  // Written and indexable once they hold real content — see UNLISTED_ROUTES below.
  serviceArea: page(
    $localize`:@@meta.serviceArea.title:Service Area | Cleaning in Dresden & Around | Glanzwork`,
    $localize`:@@meta.serviceArea.description:Where we work: every district of Dresden plus Radebeul, Freital, Pirna, Heidenau, Coswig and Meißen. Short travel times and fast call-outs.`,
  ),
  jobs: page(
    $localize`:@@meta.jobs.title:Jobs at Glanzwork Dresden | Cleaning Staff Wanted`,
    $localize`:@@meta.jobs.description:We are looking for cleaners, site supervisors and winter service helpers in Dresden. Fair pay, fixed teams and a family working atmosphere.`,
  ),
  imprint: page(
    $localize`:@@meta.imprint.title:Imprint | Glanzwork`,
    $localize`:@@meta.imprint.description:Legal information about Glanzwork, Dresden.`,
  ),
  privacy: page(
    $localize`:@@meta.privacy.title:Privacy Policy | Glanzwork`,
    $localize`:@@meta.privacy.description:How Glanzwork handles personal data.`,
  ),
  login: page(
    $localize`:@@meta.login.title:Sign In | Glanzwork`,
    $localize`:@@meta.login.description:Sign in to the Glanzwork portal.`,
  ),
};

/** Route keys whose pages are not yet written, so must not enter the index. */
const PLACEHOLDER_ROUTES: readonly StaticRouteKey[] = ['serviceArea', 'jobs'];

const NOINDEX_ROUTES = new Set<StaticRouteKey>([...UNLISTED_ROUTES, ...PLACEHOLDER_ROUTES]);

/** This build's URL for each static page, resolved once. */
const STATIC_PAGES: ReadonlyMap<string, PageMeta> = new Map(
  (Object.keys(STATIC_META) as StaticRouteKey[]).map((key) => [
    pathIn(STATIC_ROUTES[key]),
    NOINDEX_ROUTES.has(key) ? { ...STATIC_META[key], indexable: false } : STATIC_META[key],
  ]),
);

const detailMeta = (path: string): PageMeta | undefined => {
  const service = findServiceByPath(path);
  if (service) {
    return page(service.metaTitle, service.metaDescription, { image: service.image });
  }

  const project = findProjectByPath(path);
  if (project) {
    return page(
      $localize`:@@meta.project.title:${project.title}:title: | ${project.category}:category: Reference | Glanzwork`,
      project.summary,
      { image: project.image },
    );
  }

  const post = findPostByPath(path);
  if (post) {
    return page($localize`:@@meta.post.title:${post.title}:title: | Glanzwork`, post.excerpt, {
      image: post.image,
      type: 'article',
    });
  }

  return undefined;
};

/** `path` is a route URL without the leading slash, query string or fragment. */
export const resolvePageMeta = (path: string): PageMeta =>
  STATIC_PAGES.get(path) ??
  detailMeta(path) ??
  // Unknown URLs are served the home page by the router's wildcard, so they must not
  // compete with it in the index.
  page(SITE.title, SITE.description, { indexable: false });

/** Every indexable URL this build serves, for the sitemap and for tests. */
export const indexablePaths = (): string[] => [
  ...[...STATIC_PAGES.entries()].filter(([, meta]) => meta.indexable).map(([path]) => path),
  ...SERVICES.map((service) => pathIn(service.path)),
  ...PROJECTS.map((project) => pathIn(project.path)),
  ...BLOG_POSTS.map((post) => pathIn(post.path)),
];
