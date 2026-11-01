import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/**
 * The current router URL as a signal.
 *
 * Both the root component (which drops the marketing chrome inside the admin area)
 * and the admin topbar (which names the open page) need it, and neither should own
 * a second subscription to the router's event stream.
 */
@Injectable({ providedIn: 'root' })
export class RouterUrlService {
  private readonly router = inject(Router);

  readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
}
