import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent } from '../../../shared/components/icon/icon.component';

/**
 * What went wrong, or what just worked.
 *
 * The message always comes from the server when there is one: "that employee already
 * has a booking at that time" is worth reading, where a generic "could not save" sends
 * the user guessing. `core/api/api-error.ts` does that unwrapping.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-alert',
  imports: [IconComponent],
  template: `
    <div class="admin-alert admin-alert--{{ tone() }}" role="alert">
      <i [appIcon]="tone() === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle'"></i>
      <p>{{ message() }}</p>
    </div>
  `,
})
export class AdminAlertComponent {
  readonly message = input.required<string>();
  readonly tone = input<'error' | 'success'>('error');
}
