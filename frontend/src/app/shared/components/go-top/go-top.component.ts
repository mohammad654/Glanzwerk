import { Component, signal } from '@angular/core';

/** How far down the page the button becomes useful. */
const REVEAL_AFTER = 400;

@Component({
  selector: 'app-go-top',
  template: `
    <button
      class="go-top"
      type="button"
      [class.is-visible]="visible()"
      [attr.tabindex]="visible() ? 0 : -1"
      (click)="scrollToTop()"
      i18n-aria-label="@@goTop.label"
      aria-label="Back to top"
    >
      <i class="bi bi-chevron-double-up" aria-hidden="true"></i>
    </button>
  `,
  styleUrl: './go-top.component.scss',
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class GoTopComponent {
  readonly visible = signal(false);

  onWindowScroll(): void {
    this.visible.set(window.scrollY > REVEAL_AFTER);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
