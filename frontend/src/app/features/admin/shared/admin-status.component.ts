import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { StatusTone } from '../../../core/appointment';

/**
 * Re-exported so the pages that only need the badge's tone type can take it from the
 * component they are rendering, rather than reaching into `core/appointment` for it.
 */
export type { StatusTone };

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-status',
  template: `<span class="admin-status admin-status--{{ tone() }}">{{ label() }}</span>`,
})
export class AdminStatusComponent {
  readonly label = input.required<string>();
  readonly tone = input<StatusTone>('neutral');
}
