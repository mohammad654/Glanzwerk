import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent } from '../../../shared/components/icon/icon.component';

/** What a table shows instead of rows. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-empty',
  imports: [IconComponent],
  template: `
    <div class="admin-empty">
      <i [appIcon]="icon()"></i>
      <p>{{ message() }}</p>
    </div>
  `,
})
export class AdminEmptyComponent {
  readonly message = input.required<string>();
  readonly icon = input('bi-inbox');
}
