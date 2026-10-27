import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavBarComponent } from './layout/nav-bar/nav-bar.component';
import { SidebarModalComponent } from './layout/sidebar-modal/sidebar-modal.component';
import { SiteFooterComponent } from './layout/site-footer/site-footer.component';
import { TopBarComponent } from './layout/top-bar/top-bar.component';
import { GoTopComponent } from './shared/components/go-top/go-top.component';

/** Past this many pixels the header can no longer rely on the hero behind it. */
const SCROLL_THRESHOLD = 80;

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    TopBarComponent,
    NavBarComponent,
    SidebarModalComponent,
    SiteFooterComponent,
    GoTopComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class App {
  readonly scrolled = signal(false);

  onWindowScroll(): void {
    this.scrolled.set(window.scrollY > SCROLL_THRESHOLD);
  }
}
