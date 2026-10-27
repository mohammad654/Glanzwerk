import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ScrollService } from './core/services/scroll.service';
import { NavBarComponent } from './layout/nav-bar/nav-bar.component';
import { SidebarModalComponent } from './layout/sidebar-modal/sidebar-modal.component';
import { SiteFooterComponent } from './layout/site-footer/site-footer.component';
import { TopBarComponent } from './layout/top-bar/top-bar.component';
import { GoTopComponent } from './shared/components/go-top/go-top.component';
import { ScreenWipeComponent } from './shared/components/screen-wipe/screen-wipe.component';

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
    ScreenWipeComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  private readonly scroll = inject(ScrollService);

  readonly scrolled = computed(() => this.scroll.offset() > SCROLL_THRESHOLD);
}
