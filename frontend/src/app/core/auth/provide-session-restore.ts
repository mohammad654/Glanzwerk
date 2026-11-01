import { isPlatformBrowser } from '@angular/common';
import {
  EnvironmentProviders,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';

import { AuthService } from './auth.service';

/**
 * Picks the session back up on a page load.
 *
 * The access token is held in memory, so every full page load starts with no token
 * and the HttpOnly refresh cookie is the only proof a session is still there. The
 * route guards already trade it for one — but only guarded pages have a guard, and
 * the public chrome and the booking page have none. So the top bar went on offering
 * "Sign In" to somebody already signed in, and the booking page showed its sign-in
 * invitation instead of the form to somebody holding a perfectly good cookie.
 *
 * Deliberately **not** awaited. `restore()` is single-flighted and swallows its own
 * failures, but a slow or unreachable API must not hold up the bootstrap: the chrome
 * renders signed out and swaps over when the answer arrives, which the boot splash
 * covers. Browser only — there is no cookie during the prerender, and the prerendered
 * HTML is shared by every visitor, so it must never contain anyone's session.
 */
export function provideSessionRestore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      if (isPlatformBrowser(inject(PLATFORM_ID))) {
        void inject(AuthService).restore();
      }
    }),
  ]);
}
