import { Route, Routes } from '@angular/router';

import { BLOG_POSTS, blogPath } from './core/blog-catalog';
import { adminGuard, guestGuard } from './core/auth/auth.guards';
import { adminChildRoutes } from './features/admin/admin.routes';
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

  // Account pages. `guestGuard` keeps a signed-in user off the two forms rather than
  // showing them a login box they do not need.
  {
    ...staticPage('login', () =>
      import('./features/account/login-page.component').then((m) => m.LoginPageComponent),
    ),
    canActivate: [guestGuard],
  },
  {
    ...staticPage('register', () =>
      import('./features/account/register-page.component').then((m) => m.RegisterPageComponent),
    ),
    canActivate: [guestGuard],
  },
  // The two halves of a forgotten password. Both are guest-only for the same reason
  // the sign-in form is: somebody already signed in changes their password from their
  // account page, where the current one is asked for.
  {
    ...staticPage('forgotPassword', () =>
      import('./features/account/forgot-password-page.component').then(
        (m) => m.ForgotPasswordPageComponent,
      ),
    ),
    canActivate: [guestGuard],
  },
  {
    ...staticPage('resetPassword', () =>
      import('./features/account/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent,
      ),
    ),
    canActivate: [guestGuard],
  },
  // Both of these need a client session, which the page itself asks for: an anonymous
  // visitor is shown a sign-in prompt instead of being bounced, because arriving at
  // "book an appointment" and landing on a login form with no explanation is worse.
  staticPage('booking', () =>
    import('./features/account/booking-page.component').then((m) => m.BookingPageComponent),
  ),
  staticPage('account', () =>
    import('./features/account/account-page.component').then((m) => m.AccountPageComponent),
  ),

  // The internal dashboard. It brings its own shell rather than rendering inside the
  // marketing header and footer, and `UNLISTED_ROUTES` keeps the whole subtree out of
  // the index and the sitemap.
  //
  // The guard is on the parent, so it covers every child without each one repeating
  // it. It stops the wrong screen appearing; the records themselves are protected by
  // `@PreAuthorize` and the URL rules on the API, which is the side a browser cannot
  // edit. See `core/auth/auth.guards.ts`.
  {
    path: pathIn(STATIC_ROUTES.admin),
    loadComponent: () =>
      import('./features/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: adminChildRoutes(),
  },

  { path: '**', redirectTo: '' },
];
