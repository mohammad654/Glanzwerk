import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ADMIN_NAV, ADMIN_PAGES, adminLink, adminPageAt } from '../../core/admin';
import { AuthService } from '../../core/auth/auth.service';
import { COMPANY } from '../../core/company';
import { LINKS } from '../../core/routes';
import { RouterUrlService } from '../../core/services/router-url.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

/**
 * The shell every admin page renders inside: a grouped sidebar, fixed on desktop and
 * an off-canvas drawer below it, over a dark canvas.
 *
 * Encapsulation is off on purpose. The `.admin-*` classes are a shell the five pages
 * render into, so scoping them here would force every page to redeclare the table,
 * panel and card styles — the same reason `styles/components/` exists. They stay out
 * of `main.scss` instead, so the marketing site never downloads them: the stylesheet
 * ships inside this lazy-loaded chunk.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss', './admin-controls.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminLayoutComponent {
  private readonly routerUrl = inject(RouterUrlService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Who is signed in. The guard guarantees there is somebody by the time this renders. */
  readonly user = this.auth.user;

  readonly nav = ADMIN_NAV;
  readonly homeLink = adminLink('overview');
  readonly siteLink = LINKS.home;
  readonly company = COMPANY;

  /** The open page, for the topbar breadcrumb. */
  readonly current = computed(() => adminPageAt(this.routerUrl.url()) ?? ADMIN_PAGES.overview);

  /** Open only on small screens, where the sidebar is a drawer. */
  readonly menuOpen = signal(false);

  // RouterLinkActive re-reads this input whenever its identity changes, so an inline
  // object literal in the template would hand it a new object on every pass.
  readonly exactMatch = { exact: true } as const;
  readonly prefixMatch = { exact: false } as const;

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  /**
   * Ends the session and leaves the area.
   *
   * The navigation is unconditional: `logout()` drops the local token even when the
   * request to clear the cookie fails, so staying on an admin page would show a shell
   * whose every request is about to come back 401.
   */
  async signOut(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl(LINKS.login);
  }
}
