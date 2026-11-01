import { Route } from '@angular/router';

import { ADMIN_PAGES, ADMIN_PAGE_KEYS, AdminPageKey } from '../../core/admin';

type ComponentLoader = NonNullable<Route['loadComponent']>;

/**
 * One loader per page key. Typing the map as exhaustive is what keeps the sidebar
 * honest: adding a key to `ADMIN_PAGES` without building its page is a compile
 * error, not a dead link.
 */
const LOADERS: Readonly<Record<AdminPageKey, ComponentLoader>> = {
  overview: () =>
    import('./pages/admin-overview.component').then((m) => m.AdminOverviewComponent),
  appointments: () =>
    import('./pages/admin-appointments.component').then((m) => m.AdminAppointmentsComponent),
  clients: () => import('./pages/admin-clients.component').then((m) => m.AdminClientsComponent),
  employees: () =>
    import('./pages/admin-employees.component').then((m) => m.AdminEmployeesComponent),
  services: () =>
    import('./pages/admin-services.component').then((m) => m.AdminServicesComponent),
  enquiries: () =>
    import('./pages/admin-enquiries.component').then((m) => m.AdminEnquiriesComponent),
};

/** The admin area's child routes, in the same order as the sidebar. */
export const adminChildRoutes = (): Route[] =>
  ADMIN_PAGE_KEYS.map((key) => ({
    path: ADMIN_PAGES[key].path,
    loadComponent: LOADERS[key],
  }));
