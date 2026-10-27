import { SERVICES, servicePath } from './service-catalog';

export interface NavItem {
  label: string;
  path: string;
  children?: readonly NavItem[];
}

// One list drives both the header menu and the route table, so a link can never
// point at a route that does not exist.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: $localize`:@@nav.home:Home`, path: '' },
  { label: $localize`:@@nav.about:About`, path: 'about' },
  {
    label: $localize`:@@nav.services:Services`,
    path: 'services',
    // Built from the catalog, so adding a service adds its menu entry and route.
    children: SERVICES.map((service) => ({
      label: service.shortTitle,
      path: servicePath(service.slug),
    })),
  },
  { label: $localize`:@@nav.projects:Projects`, path: 'projects' },
  { label: $localize`:@@nav.blog:Blog`, path: 'blog' },
  { label: $localize`:@@nav.contact:Contact`, path: 'contact' },
];

/** Flattens parents and children into the single list the router needs. */
export function flattenNavItems(items: readonly NavItem[] = NAV_ITEMS): NavItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenNavItems(item.children) : [])]);
}

/**
 * The ancestors of a path, outermost first — what a breadcrumb sits between
 * Home and the current page. Null when the path is not in the menu at all.
 */
export function findAncestors(
  path: string,
  items: readonly NavItem[] = NAV_ITEMS,
  ancestors: NavItem[] = [],
): NavItem[] | null {
  for (const item of items) {
    if (item.path === path) {
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
