import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { LINKS } from '../routes';
import { AuthService } from './auth.service';
import { Role } from './session';

/**
 * Keeps a page shut until the session is known.
 *
 * A guard, not an `@if` in a template: the page's data requests start the moment its
 * component is constructed, and a component that renders first and checks second has
 * already fired an admin request on behalf of someone who may not be signed in.
 *
 * It is worth being clear about what this is for. The guard is a *routing* decision —
 * it stops the wrong screen appearing and sends people to the login page. It is not
 * the access control: that is `@PreAuthorize` and the URL rules on the backend, which
 * is the only side a browser cannot edit. Deleting this guard would be a usability
 * bug; it would not expose a single record.
 */
const requireRole = (role: Role): CanActivateFn => {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // An access token is held in memory only, so a reload arrives here with nothing.
    // The refresh cookie is what proves there is still a session.
    await auth.restore();

    if (auth.hasRole(role)) {
      return true;
    }

    return router.createUrlTree([LINKS.login], {
      // So signing in continues to the page that was asked for.
      queryParams: { returnUrl: state.url },
    });
  };
};

/**
 * `/admin` and everything under it.
 *
 * The only role guard there is. The booking and account pages are *not* guarded on
 * purpose: arriving at "book an appointment" and being bounced to a login form with no
 * explanation is worse than being asked to sign in on the page you wanted, so they
 * render an invitation instead. See the comments on those routes in `app.routes.ts`.
 */
export const adminGuard = requireRole('ADMIN');

/** Keeps a signed-in user off the sign-in and registration pages. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.restore();

  if (!auth.isSignedIn()) {
    return true;
  }

  return router.createUrlTree([auth.isAdmin() ? LINKS.admin : LINKS.account]);
};
