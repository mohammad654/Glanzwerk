import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { pathIn } from '../../core/i18n/localized-path';
import { NAV_ITEMS, navLink } from '../../core/navigation';
import { SidebarService } from '../../core/services/sidebar.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LINKS } from '../../core/routes';

@Component({
  selector: 'app-nav-bar',
  imports: [IconComponent, RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent {
  /** Static-page links, so no template spells a URL out. */
  readonly links = LINKS;

  private readonly sidebar = inject(SidebarService);

  /**
   * The menu with its links already resolved. Templates should not build URLs: the
   * path differs per locale, and a string concatenation in a template hides that.
   */
  readonly items = NAV_ITEMS.map((item) => ({
    label: item.label,
    link: navLink(item),
    isHome: pathIn(item.path) === '',
    children: item.children?.map((child) => ({ label: child.label, link: navLink(child) })),
  }));

  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  openSidebar(): void {
    this.sidebar.open();
  }
}
