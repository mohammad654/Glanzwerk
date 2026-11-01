import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

import { IconComponent } from '../../../shared/components/icon/icon.component';

/**
 * The panel a table sits in: heading, search box and a count of what survived the
 * filter. The rows themselves are projected, because a client row and an employee
 * row share no columns — driving them from a shared column config would be more
 * code than the markup it replaced, not less.
 *
 * `query` is a two-way `model`, so a page owns its own filter state and this stays
 * a dumb control.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-table-panel',
  imports: [IconComponent],
  template: `
    <section class="admin-panel">
      <header class="admin-panel__header">
        <div class="admin-panel__heading">
          <h2>{{ title() }}</h2>
          <span class="admin-panel__count">{{ count() }} / {{ total() }}</span>
        </div>

        <label class="admin-search">
          <i appIcon="bi-search"></i>
          <input
            type="search"
            [value]="query()"
            [placeholder]="placeholder()"
            [attr.aria-label]="placeholder()"
            (input)="onInput($event)"
          />
        </label>
      </header>

      <!-- Its own strip, not a third thing competing for the header row: a filter
           row is as wide as its longest label and would otherwise push the search
           box onto a second line the moment a status was renamed. Collapses to
           nothing on a page that projects no filters. -->
      <div class="admin-panel__filters">
        <ng-content select="[adminPanelFilters]" />
      </div>

      <ng-content />
    </section>
  `,
})
export class AdminTablePanelComponent {
  readonly title = input.required<string>();
  readonly placeholder = input.required<string>();
  /** Rows after filtering, and rows in total — "7 / 14" is the honest form. */
  readonly count = input.required<number>();
  readonly total = input.required<number>();

  readonly query = model('');

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
