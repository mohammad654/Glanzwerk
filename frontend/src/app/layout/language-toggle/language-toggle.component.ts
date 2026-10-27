import { NgTemplateOutlet } from '@angular/common';
import { Component, LOCALE_ID, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { LOCALES, localizedPath, toLocaleCode } from '../../core/i18n/locales';

@Component({
  selector: 'app-language-toggle',
  imports: [NgTemplateOutlet],
  templateUrl: './language-toggle.component.html',
  styleUrl: './language-toggle.component.scss',
})
export class LanguageToggleComponent {
  private readonly router = inject(Router);

  /** Each locale is its own build, so the build itself knows which one it is. */
  private readonly current = toLocaleCode(inject(LOCALE_ID));

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Seven red stripes on a 14-unit flag; the white ones are the background. */
  readonly stripes = [0, 2.154, 4.308, 6.462, 8.616, 10.77, 12.924];

  /** Five rows of stars, simplified for a 20px flag where 50 would be mud. */
  readonly stars = [1.4, 3.4, 5.4].flatMap((y) => [1.4, 3.4, 5.4, 7.2].map((x) => ({ x, y })));

  readonly options = computed(() =>
    LOCALES.map((locale) => ({
      ...locale,
      isCurrent: locale.code === this.current,
      href: localizedPath(this.url().split(/[?#]/)[0], locale.code),
    })),
  );
}
