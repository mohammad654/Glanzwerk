import { Routes } from '@angular/router';

import { flattenNavItems } from './core/navigation';
import { PagePlaceholderComponent } from './shared/components/page-placeholder/page-placeholder.component';

// Pages that are actually built. Everything else in the menu falls through to a
// placeholder below, so the nav never points at a dead route.
const BUILT_PAGES: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/about/about-page.component').then((m) => m.AboutPageComponent),
  },
  {
    path: 'services',
    loadComponent: () =>
      import('./features/services/services-page.component').then((m) => m.ServicesPageComponent),
  },
  {
    path: 'services/:slug',
    loadComponent: () =>
      import('./features/services/service-detail.component').then((m) => m.ServiceDetailComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact-page.component').then((m) => m.ContactPageComponent),
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/projects-page.component').then((m) => m.ProjectsPageComponent),
  },
  {
    path: 'projects/:slug',
    loadComponent: () =>
      import('./features/projects/project-detail.component').then((m) => m.ProjectDetailComponent),
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./features/blog/blog-page.component').then((m) => m.BlogPageComponent),
  },
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./features/blog/blog-detail.component').then((m) => m.BlogDetailComponent),
  },
];

const builtPaths = new Set(BUILT_PAGES.map((route) => route.path));

// Service pages are served by the ':slug' route above, not by a placeholder.
const isServiceDetail = (path: string): boolean => path.startsWith('services/');

export const routes: Routes = [
  ...BUILT_PAGES,
  ...flattenNavItems()
    .filter((item) => !builtPaths.has(item.path) && !isServiceDetail(item.path))
    .map(({ label, path }) => ({
      path,
      component: PagePlaceholderComponent,
      data: { title: label },
    })),
  { path: 'login', component: PagePlaceholderComponent, data: { title: 'Sign In' } },
  { path: '**', redirectTo: '' },
];
