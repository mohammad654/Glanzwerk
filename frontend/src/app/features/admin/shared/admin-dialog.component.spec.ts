import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AdminDialogComponent } from './admin-dialog.component';

/**
 * A caller, standing in for the five admin pages. They all use the dialog the same
 * way — `@if` around it, a title in and `dismissed` out — so testing it through one
 * host tests the contract all of them rely on.
 */
@Component({
  imports: [AdminDialogComponent],
  template: `
    @if (open()) {
      <app-admin-dialog [title]="'Edit service'" (dismissed)="dismissals = dismissals + 1">
        <p class="projected">the form</p>
        <button adminDialogFooter type="button">Save</button>
      </app-admin-dialog>
    }
  `,
})
class HostComponent {
  readonly open = signal(true);
  dismissals = 0;
}

describe('AdminDialogComponent', () => {
  const createHost = async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return fixture;
  };

  const dialogEl = (fixture: Awaited<ReturnType<typeof createHost>>) =>
    fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;

  it('renders as a native dialog, so focus and inertness come from the platform', async () => {
    const fixture = await createHost();

    const dialog = dialogEl(fixture);
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-label')).toBe('Edit service');
  });

  it('projects the form and the footer into their own slots', async () => {
    const fixture = await createHost();

    expect(fixture.nativeElement.querySelector('.admin-dialog__body .projected')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.admin-dialog__footer [adminDialogFooter]'),
    ).not.toBeNull();
  });

  it('asks to be dismissed when the close button is pressed', async () => {
    const fixture = await createHost();

    fixture.nativeElement.querySelector('.admin-dialog__header button').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.dismissals).toBe(1);
  });

  // Escape reaches the dialog as a `cancel` event. The <div> this replaced bound
  // `keydown.escape` to an element that never held focus, so Escape did nothing until
  // the user had clicked into a field — this is the regression that guards it.
  it('asks to be dismissed on Escape, however the form is focused', async () => {
    const fixture = await createHost();

    dialogEl(fixture).dispatchEvent(new Event('cancel'));
    await fixture.whenStable();

    expect(fixture.componentInstance.dismissals).toBe(1);
  });

  // A half-filled form is easy to lose to a stray click, which is why the backdrop is
  // deliberately not a way out. Native modal dialogs behave this way already; the test
  // is here so nobody "fixes" it by adding a backdrop click handler.
  it('does not dismiss on a click on the dialog itself', async () => {
    const fixture = await createHost();

    dialogEl(fixture).click();
    await fixture.whenStable();

    expect(fixture.componentInstance.dismissals).toBe(0);
  });
});
