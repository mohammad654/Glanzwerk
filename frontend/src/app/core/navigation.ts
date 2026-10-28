import { LocalizedPath, linkTo, pathIn } from './i18n/localized-path';
import { STATIC_ROUTES } from './routes';
import { SERVICES } from './service-catalog';

export interface NavItem {
  label: string;
  path: LocalizedPath;
  children?: readonly NavItem[];
}

/**
 * The header menu. Every path is a `STATIC_ROUTES` entry or a catalogue entry, and
 * `app.routes.ts` builds the route table from those same two sources, so a menu link
 * cannot point at a route that does not exist.
 *
 * Einsatzgebiet, Jobs, Impressum and Datenschutz are deliberately footer-only: they
 * are pages the site needs, not journeys the header should spend space on.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: $localize`:@@nav.home:Home`, path: STATIC_ROUTES.home },
  { label: $localize`:@@nav.about:About`, path: STATIC_ROUTES.about },
  {
    label: $localize`:@@nav.services:Services`,
    path: STATIC_ROUTES.services,
    // Built from the catalogue, so adding a service adds its menu entry and route.
    children: SERVICES.map((service) => ({
      label: service.shortTitle,
      path: service.path,
    })),
  },
  { label: $localize`:@@nav.references:References`, path: STATIC_ROUTES.references },
  { label: $localize`:@@nav.blog:Advice`, path: STATIC_ROUTES.blog },
  { label: $localize`:@@nav.contact:Contact`, path: STATIC_ROUTES.contact },
];

/** Flattens parents and children into a single list. */
export function flattenNavItems(items: readonly NavItem[] = NAV_ITEMS): NavItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenNavItems(item.children) : [])]);
}

/**
 * The ancestors of a path, outermost first — what a breadcrumb sits between Home and
 * the current page. Null when the path is not in the menu at all.
 *
 * Service pages live at the site root for SEO but still belong under Services in the
 * menu, so the trail comes from this tree rather than from the URL's segments.
 */
export function findAncestors(
  path: string,
  items: readonly NavItem[] = NAV_ITEMS,
  ancestors: NavItem[] = [],
): NavItem[] | null {
  for (const item of items) {
    if (pathIn(item.path) === path) {
      return ancestors;
    }

    if (item.children) {
      const found = findAncestors(path, item.children, [...ancestors, item]);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/** The menu item's link in this build. */
export const navLink = (item: NavItem): string => linkTo(item.path);

/** The breadcrumb trail for a path, as the label/path pairs the banner renders. */
export const trailFor = (path: string): { label: string; path: string }[] =>
  (findAncestors(path) ?? []).map((item) => ({ label: item.label, path: pathIn(item.path) }));
