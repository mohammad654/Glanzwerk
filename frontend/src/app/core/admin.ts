import { pathIn } from './i18n/localized-path';
import { LINKS, STATIC_ROUTES } from './routes';

/**
 * One page of the admin area.
 *
 * The admin area is an internal tool, so its paths are deliberately *not* localised:
 * there is no `hreflang` pair to keep, nothing for a crawler to index and nobody
 * reaching it from a search result. Only `/admin` itself is a `STATIC_ROUTES` entry,
 * which is what makes the whole subtree noindex.
 */
export interface AdminPage {
  /** Path under `/admin`. Empty for the landing page. */
  readonly path: string;
  /** Which sidebar group the page is filed under. */
  readonly group: AdminGroupKey;
  /** Sprite symbol id, as `shared/components/icon` expects it. */
  readonly icon: string;
  /** Sidebar label, page heading and document title. */
  readonly label: string;
  /** One line under the heading, saying what the page is for. */
  readonly lead: string;
}

/**
 * The sidebar's captions, in the order they appear. Grouping is what stops a flat
 * list of pages reading as an undifferentiated pile once there are more than a few.
 */
export const ADMIN_GROUPS = {
  dashboard: $localize`:@@admin.group.dashboard:Dashboard`,
  management: $localize`:@@admin.group.management:Management`,
} as const;

export type AdminGroupKey = keyof typeof ADMIN_GROUPS;

/**
 * Every page in the admin area, in sidebar order.
 *
 * This is the single source of truth: `features/admin/admin.routes.ts` builds the
 * route table from these keys and the sidebar renders the same list, so a nav entry
 * cannot point at a page that was never built and a new page cannot ship unlinked.
 */
export const ADMIN_PAGES = {
  overview: {
    path: '',
    group: 'dashboard',
    icon: 'bi-speedometer2',
    label: $localize`:@@admin.overview.label:Overview`,
    lead: $localize`:@@admin.overview.lead:Today's jobs and the numbers behind them.`,
  },
  appointments: {
    path: 'appointments',
    group: 'management',
    icon: 'bi-calendar-check',
    label: $localize`:@@admin.appointments.label:Appointments`,
    lead: $localize`:@@admin.appointments.lead:Every appointment, with the client, the service and who is going.`,
  },
  clients: {
    path: 'clients',
    group: 'management',
    icon: 'bi-people',
    label: $localize`:@@admin.clients.label:Clients`,
    lead: $localize`:@@admin.clients.lead:The companies and households we clean for.`,
  },
  employees: {
    path: 'employees',
    group: 'management',
    icon: 'bi-person-badge',
    label: $localize`:@@admin.employees.label:Employees`,
    lead: $localize`:@@admin.employees.lead:The team, what they are qualified for and how booked they are.`,
  },
  services: {
    path: 'services',
    group: 'management',
    icon: 'bi-list-check',
    label: $localize`:@@admin.services.label:Services`,
    lead: $localize`:@@admin.services.lead:The service catalogue the public site and the booking form are built from.`,
  },
  enquiries: {
    path: 'enquiries',
    group: 'management',
    icon: 'bi-envelope-paper',
    label: $localize`:@@admin.enquiries.label:Enquiries`,
    lead: $localize`:@@admin.enquiries.lead:Messages from the website's contact form, and where each one stands.`,
  },
} as const satisfies Record<string, AdminPage>;

export type AdminPageKey = keyof typeof ADMIN_PAGES;

export const ADMIN_PAGE_KEYS = Object.keys(ADMIN_PAGES) as readonly AdminPageKey[];

/** The first URL segment of the admin area — `admin` in both locales. */
const ADMIN_ROOT = pathIn(STATIC_ROUTES.admin);

/** Router link for an admin page, so no template spells a path out. */
export const adminLink = (key: AdminPageKey): string =>
  [LINKS.admin, ADMIN_PAGES[key].path].filter(Boolean).join('/');

/** The page's document title. Kept here so the sidebar and the title cannot drift. */
export const adminTitle = (page: AdminPage): string =>
  $localize`:@@admin.title:${page.label}:label: | Glanzwork Admin`;

/** Strips a leading slash, a query string and a fragment off a router URL. */
const segmentsOf = (url: string): string[] =>
  url.split(/[?#]/)[0].replace(/^\/+/, '').split('/').filter(Boolean);

/**
 * Whether a router URL is inside the admin area. The root component asks this to
 * leave off the marketing header, footer and boot splash — the admin area brings
 * its own shell.
 */
export const isAdminUrl = (url: string): boolean => segmentsOf(url)[0] === ADMIN_ROOT;

/** The admin page a URL resolves to, or undefined when it is not an admin URL. */
export const adminPageAt = (url: string): AdminPage | undefined => {
  const segments = segmentsOf(url);
  if (segments[0] !== ADMIN_ROOT) {
    return undefined;
  }

  const rest = segments.slice(1).join('/');
  return ADMIN_PAGE_KEYS.map((key) => ADMIN_PAGES[key]).find((page) => page.path === rest);
};

/** What the sidebar renders, resolved once at module scope. */
export interface AdminNavItem extends AdminPage {
  readonly key: AdminPageKey;
  readonly link: string;
  /** The landing page would otherwise stay highlighted on every child route. */
  readonly exact: boolean;
}

export interface AdminNavSection {
  readonly key: AdminGroupKey;
  readonly title: string;
  readonly items: readonly AdminNavItem[];
}

const navItem = (key: AdminPageKey): AdminNavItem => ({
  ...ADMIN_PAGES[key],
  key,
  link: adminLink(key),
  exact: ADMIN_PAGES[key].path === '',
});

/**
 * The sidebar, grouped. Derived from the page registry rather than written out
 * beside it, so a page cannot appear in one and not the other.
 */
export const ADMIN_NAV: readonly AdminNavSection[] = (
  Object.keys(ADMIN_GROUPS) as AdminGroupKey[]
)
  .map((group) => ({
    key: group,
    title: ADMIN_GROUPS[group],
    items: ADMIN_PAGE_KEYS.filter((key) => ADMIN_PAGES[key].group === group).map(navItem),
  }))
  .filter((section) => section.items.length > 0);
