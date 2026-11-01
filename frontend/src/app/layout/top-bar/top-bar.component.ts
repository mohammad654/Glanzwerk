import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { COMPANY } from '../../core/company';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LINKS } from '../../core/routes';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-top-bar',
  imports: [IconComponent, RouterLink, LanguageToggleComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
})
export class TopBarComponent {
  private readonly auth = inject(AuthService);

  /** Static-page links, so no template spells a URL out. */
  readonly links = LINKS;

  readonly company = COMPANY;

  readonly signedIn = this.auth.isSignedIn;

  /** First name only: the bar is one line and a full name wraps it on a laptop. */
  readonly userName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');

  /**
   * Signed out in the prerendered HTML, because that file is served to everybody.
   * `provideSessionRestore()` swaps this over once the refresh cookie has been
   * traded for a token, which the boot splash covers.
   */
  readonly accountLink = computed(() => (this.auth.isAdmin() ? LINKS.admin : LINKS.account));

  signOut(): void {
    void this.auth.logout();
  }
}
