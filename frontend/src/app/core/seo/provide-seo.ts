import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { SeoService } from './seo.service';

/**
 * Keeps title, meta tags, canonical URL and JSON-LD in step with the route. Doing it
 * here rather than in each page component means a new page cannot ship without metadata.
 */
export function provideSeo(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const seo = inject(SeoService);
      inject(Router)
        .events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => seo.update(event.urlAfterRedirects));
    }),
  ]);
}
