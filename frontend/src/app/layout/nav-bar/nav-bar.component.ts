import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NAV_ITEMS } from '../../core/navigation';
import { SidebarService } from '../../core/services/sidebar.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-nav-bar',
  imports: [IconComponent, RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent {
  private readonly sidebar = inject(SidebarService);

  readonly items = NAV_ITEMS;

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
