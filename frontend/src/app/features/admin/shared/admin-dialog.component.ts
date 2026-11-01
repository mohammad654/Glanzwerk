import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';

import { IconComponent } from '../../../shared/components/icon/icon.component';

/**
 * The shell every admin form opens in.
 *
 * It owns the overlay, the heading, the close button and the footer; the form itself
 * is projected, because an employee form and a booking form share no fields. The
 * caller decides whether it is in the DOM at all, so there is no open/closed state
 * here to get out of step with theirs.
 *
 * Built on the native `<dialog>` and `showModal()`, which is what makes the rest of
 * this small: the platform moves focus inside on open, keeps Tab from leaving, marks
 * everything behind it inert, and returns focus to whatever opened it on close. The
 * hand-rolled version of that is a focus trap nobody wants to own, and the `<div>`
 * this replaced had none of it — Escape was bound to an element that never held
 * focus, so it only worked once the user had clicked into a field.
 *
 * Escape closes it and the backdrop does not: a half-filled form is easy to lose to
 * a stray click, and an accidental close costs more than the extra keystroke. That is
 * the native default, so it is not spelled out anywhere.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-dialog',
  imports: [IconComponent],
  template: `
    <dialog #dialog class="admin-dialog" [attr.aria-label]="title()" (cancel)="dismissed.emit()">
      <div class="admin-dialog__panel">
        <header class="admin-dialog__header">
          <h2>{{ title() }}</h2>
          <button
            type="button"
            class="admin-btn admin-btn--quiet"
            (click)="dismissed.emit()"
            i18n-aria-label="@@admin.dialog.close"
            aria-label="Close"
          >
            <i appIcon="bi-x-lg"></i>
          </button>
        </header>

        <div class="admin-dialog__body">
          <ng-content />
        </div>

        <footer class="admin-dialog__footer">
          <ng-content select="[adminDialogFooter]" />
        </footer>
      </div>
    </dialog>
  `,
})
export class AdminDialogComponent {
  readonly title = input.required<string>();
  readonly dismissed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    // `afterNextRender` rather than an effect: `showModal()` is a DOM call on a real
    // element, and the admin area is behind a guard but its component still must not
    // reach for one while prerendering.
    //
    // Called optionally because jsdom does not implement it, so an unguarded call
    // turns every future test that opens an admin form into a TypeError. Every
    // browser Angular supports has it.
    afterNextRender(() => this.dialog().nativeElement.showModal?.());
  }
}
