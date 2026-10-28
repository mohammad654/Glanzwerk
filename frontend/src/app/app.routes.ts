import { Route, Routes } from '@angular/router';

import { BLOG_POSTS, blogPath } from './core/blog-catalog';
import { pathIn } from './core/i18n/localized-path';
import { PROJECTS, projectPath } from './core/project-catalog';
import { STATIC_ROUTES, StaticRouteKey } from './core/routes';
import { SERVICES, servicePath } from './core/service-catalog';
import { PagePlaceholderComponent } from './shared/components/page-placeholder/page-placeholder.component';

/**
 * Every route is generated from `STATIC_ROUTES` or a content catalogue — the same two
 * sources the menu is built from — so the menu can never link to a missing page and a
 * new catalogue entry cannot ship without its route.
 *
 * Service pages sit at the site root rather than under a parent segment, which is what
 * the SEO plan asks for. That rules out a `:slug` route (it would swallow every other
 * page), so each one is listed explicitly and carries its key in `data`.
 */
type ComponentLoader = NonNullable<Route['loadComponent']>;

const staticPage = (key: StaticRouteKey, loadComponent: ComponentLoader): Route => ({
  path: pathIn(STATIC_ROUTES[key]),
  loadComponent,
});

const placeholder = (key: StaticRouteKey, title: string): Route => ({
  path: pathIn(STATIC_ROUTES[key]),
  component: PagePlaceholderComponent,
  data: { title },
});

const serviceDetail = () =>
  import('./features/services/service-detail.component').then((m) => m.ServiceDetailComponent);

const projectDetail = () =>
  import('./features/projects/project-detail.component').then((m) => m.ProjectDetailComponent);

const blogDetail = () =>
  import('./features/blog/blog-detail.component').then((m) => m.BlogDetailComponent);

export const routes: Routes = [
  staticPage('home', () => import('./features/home/home.component').then((m) => m.HomeComponent)),
  staticPage('about', () =>
    import('./features/about/about-page.component').then((m) => m.AboutPageComponent),
  ),
  staticPage('services', () =>
    import('./features/services/services-page.component').then((m) => m.ServicesPageComponent),
  ),
  staticPage('references', () =>
    import('./features/projects/projects-page.component').then((m) => m.ProjectsPageComponent),
  ),
  staticPage('blog', () =>
    import('./features/blog/blog-page.component').then((m) => m.BlogPageComponent),
  ),
  staticPage('contact', () =>
    import('./features/contact/contact-page.component').then((m) => m.ContactPageComponent),
  ),

  ...SERVICES.map((service) => ({
    path: servicePath(service),
    loadComponent: serviceDetail,
    data: { key: service.key },
  })),
  ...PROJECTS.map((project) => ({
    path: projectPath(project),
    loadComponent: projectDetail,
    data: { key: project.key },
  })),
  ...BLOG_POSTS.map((post) => ({
    path: blogPath(post),
    loadComponent: blogDetail,
    data: { key: post.key },
  })),

  // Pages the site owes its visitors but has not been written yet. They are routed so
  // the footer never links into nothing, and `page-meta.ts` keeps them out of the index.
  placeholder('serviceArea', $localize`:@@page.serviceArea.title:Service Area`),
  placeholder('jobs', $localize`:@@page.jobs.title:Jobs`),
  placeholder('imprint', $localize`:@@page.imprint.title:Imprint`),
  placeholder('privacy', $localize`:@@page.privacy.title:Privacy Policy`),
  placeholder('login', $localize`:@@page.login.title:Sign In`),

  { path: '**', redirectTo: '' },
];
