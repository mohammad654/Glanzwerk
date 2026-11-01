import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { AdminPage } from '../../../core/admin';

/**
 * The heading every admin page opens with. Title and lead come from the page
 * registry, so the sidebar label, the heading and the browser tab always agree.
 * Projected content sits on the right: a search box, a filter row or an action.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-page-header',
  template: `
    <header class="admin-page">
      <div>
        <h1>{{ page().label }}</h1>
        <p>{{ page().lead }}</p>
      </div>
      <ng-content />
    </header>
  `,
})
export class AdminPageHeaderComponent {
  readonly page = input.required<AdminPage>();
}
