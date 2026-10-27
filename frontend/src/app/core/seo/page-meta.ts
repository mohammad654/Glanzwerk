import { BLOG_POSTS } from '../blog-catalog';
import { PROJECTS } from '../project-catalog';
import { SERVICES } from '../service-catalog';
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

const STATIC_PAGES: Readonly<Record<string, PageMeta>> = {
  '': page(SITE.title, SITE.description),
  about: page(
    $localize`:@@meta.about.title:About Glanzwerk | One Team For Cleaning, Moving & More`,
    $localize`:@@meta.about.description:Directly employed, insured and vetted staff covering cleaning, moving, clearance and property support, with fixed pricing agreed before any work begins.`,
  ),
  services: page(
    $localize`:@@meta.services.title:Cleaning, Moving & Property Services | Glanzwerk`,
    $localize`:@@meta.services.description:Seven services from one team: home and commercial cleaning, moving, snow and outdoor work, 24/7 emergencies, property maintenance and waste removal.`,
  ),
  projects: page(
    $localize`:@@meta.projects.title:Our Work | Cleaning & Property Project Examples | Glanzwerk`,
    $localize`:@@meta.projects.description:Real jobs we have delivered: office contracts, facade and kitchen cleaning, pressure washing and winter service, with the scope and schedule behind each one.`,
  ),
  blog: page(
    $localize`:@@meta.blog.title:Cleaning & Property Advice | Glanzwerk Blog`,
    $localize`:@@meta.blog.description:Practical guidance on cleaning frequencies, written specifications and post-construction handover, from the team that does the work.`,
  ),
  contact: page(
    $localize`:@@meta.contact.title:Contact Glanzwerk | Request A Free Quote`,
    $localize`:@@meta.contact.description:Tell us what you need and we will come back with a fixed written price. Same-day and out-of-hours work included. Call, email or send an enquiry.`,
  ),
  // A placeholder until the page is built; indexing an empty page costs rankings.
  login: page(
    $localize`:@@meta.login.title:Sign In | Glanzwerk`,
    $localize`:@@meta.login.description:Sign in to the Glanzwerk portal.`,
    { indexable: false },
  ),
};

const detailMeta = (path: string): PageMeta | undefined => {
  const service = SERVICES.find((item) => `services/${item.slug}` === path);
  if (service) {
    return page(service.metaTitle, service.metaDescription, { image: service.image });
  }

  const project = PROJECTS.find((item) => `projects/${item.slug}` === path);
  if (project) {
    return page(`${project.title} | ${project.category} Case Study | Glanzwerk`, project.summary, {
      image: project.image,
    });
  }

  const post = BLOG_POSTS.find((item) => `blog/${item.slug}` === path);
  if (post) {
    return page(`${post.title} | Glanzwerk`, post.excerpt, {
      image: post.image,
      type: 'article',
    });
  }

  return undefined;
};

/** `path` is a route URL without the leading slash, query string or fragment. */
export const resolvePageMeta = (path: string): PageMeta =>
  STATIC_PAGES[path] ??
  detailMeta(path) ??
  // Unknown URLs are served the home page by the router's wildcard, so they must not
  // compete with it in the index.
  page(SITE.title, SITE.description, { indexable: false });
