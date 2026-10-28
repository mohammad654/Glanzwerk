import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { trailFor } from '../../../core/navigation';
import { PageBannerComponent } from '../page-banner/page-banner.component';

@Component({
  selector: 'app-page-placeholder',
  imports: [PageBannerComponent],
  template: `
    <app-page-banner [title]="title()" [trail]="trail()" />

    <section class="page-placeholder">
      <div class="container text-center">
        <p class="mb-0" i18n="@@placeholder.body">This page has not been built yet.</p>
      </div>
    </section>
  `,
  // Not ".placeholder" — that is Bootstrap's loading-skeleton utility.
  styles: `
    .page-placeholder {
      padding: 6rem 0;
    }
  `,
})
export class PagePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = toSignal(this.route.data.pipe(map((data) => data['title'] as string)), {
    initialValue: '',
  });

  private readonly path = toSignal(
    this.route.url.pipe(map((segments) => segments.map((segment) => segment.path).join('/'))),
    { initialValue: '' },
  );

  readonly trail = computed(() => trailFor(this.path()));
}
