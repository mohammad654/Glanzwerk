import { Component, computed, inject } from '@angular/core';

import { ScrollService } from '../../../core/services/scroll.service';
import { IconComponent } from '../icon/icon.component';

/** How far down the page the button becomes useful. */
const REVEAL_AFTER = 400;

@Component({
  selector: 'app-go-top',
  imports: [IconComponent],
  template: `
    <button
      class="go-top"
      type="button"
      [class.is-visible]="visible()"
      [attr.tabindex]="visible() ? 0 : -1"
      (click)="scroll.toTop()"
      i18n-aria-label="@@goTop.label"
      aria-label="Back to top"
    >
      <i appIcon="bi-chevron-double-up" aria-hidden="true"></i>
    </button>
  `,
  styleUrl: './go-top.component.scss',
})
export class GoTopComponent {
  protected readonly scroll = inject(ScrollService);

  readonly visible = computed(() => this.scroll.offset() > REVEAL_AFTER);
}
