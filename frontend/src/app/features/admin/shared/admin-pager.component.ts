import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Paged } from '../data/paged';

/**
 * Page back and forth through a server-side page.
 *
 * Deliberately not a numbered pager. The tables it sits under are worked through by
 * filtering, not by jumping to page 7, and a numbered strip would be more markup and
 * one more thing to keep in step with the filter row.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-pager',
  imports: [IconComponent],
  template: `
    @if (page().totalPages > 1) {
      <div class="admin-pager">
        <span>{{ range() }}</span>

        <div class="admin-actions">
          <button
            type="button"
            class="admin-btn admin-btn--quiet"
            [disabled]="page().page === 0"
            (click)="goTo.emit(page().page - 1)"
            i18n-aria-label="@@admin.pager.previous"
            aria-label="Previous page"
          >
            <i appIcon="bi-chevron-left"></i>
          </button>
          <button
            type="button"
            class="admin-btn admin-btn--quiet"
            [disabled]="page().page >= page().totalPages - 1"
            (click)="goTo.emit(page().page + 1)"
            i18n-aria-label="@@admin.pager.next"
            aria-label="Next page"
          >
            <i appIcon="bi-chevron-right"></i>
          </button>
        </div>
      </div>
    }
  `,
})
export class AdminPagerComponent {
  readonly page = input.required<Paged<unknown>>();
  readonly goTo = output<number>();

  /** "26–50 of 180". Digits and a dash read the same in both languages. */
  readonly range = computed(() => {
    const { page, size, totalItems } = this.page();
    const first = page * size + 1;
    const last = Math.min(first + size - 1, totalItems);
    return `${first}–${last} / ${totalItems}`;
  });
}
