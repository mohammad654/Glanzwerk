import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';

import { COMPANY, SOCIAL_LINKS } from '../../core/company';
import { SERVICES } from '../../core/service-catalog';
import { SidebarService } from '../../core/services/sidebar.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

/**
 * The slide-in information panel.
 *
 * It claims `role="dialog"` and `aria-modal="true"`, and those two attributes are a
 * promise to assistive technology: that everything outside the dialog is unreachable
 * while it is open, and that the keyboard is inside it. Nothing here kept that promise
 * — opening the panel left focus on the burger button, which a screen reader then
 * treated as outside the dialog and ignored, so there was no way in from the keyboard
 * and no way back out but to find the page's end. Hence the three pieces below:
 * focus moves in on open, Tab is held inside, and focus returns to whatever opened it.
 *
 * `inert` on the wrapper covers what CSS cannot: `visibility: hidden` does take the
 * closed panel out of the tab order, but only once its 0.4s transition has finished.
 *
 * Not a native `<dialog>`, unlike `AdminDialogComponent`, which gets all of this from
 * the platform. A modal `<dialog>` is `display: none` until `showModal()`, which has
 * nowhere to slide in from — and this panel is in the prerendered HTML of every page
 * rather than created when it opens, so there is no render to hook `showModal()` to.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar-modal',
  imports: [IconComponent],
  templateUrl: './sidebar-modal.component.html',
  styleUrl: './sidebar-modal.component.scss',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class SidebarModalComponent {
  /** Everything that can hold focus, in document order. */
  private static readonly FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  private readonly sidebar = inject(SidebarService);
  // Injected rather than global: this effect also runs while prerendering,
  // where there is no document on globalThis.
  private readonly document = inject(DOCUMENT);

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** Who had focus before the panel opened, so it can be given back. */
  private previouslyFocused: HTMLElement | null = null;

  readonly company = COMPANY;
  readonly socials = SOCIAL_LINKS;
  readonly isOpen = this.sidebar.isOpen;

  readonly highlights = SERVICES.map((service) => ({
    icon: service.icon,
    label: service.shortTitle,
  }));

  constructor() {
    effect(() => {
      const open = this.isOpen();

      // The page behind the panel should not scroll while it is open.
      this.document.body.style.overflow = open ? 'hidden' : '';

      if (open) {
        this.previouslyFocused = this.activeElement();
        // On the next frame, so the panel is laid out and focusable before focus
        // moves. Reached through DOCUMENT rather than the global: this effect also
        // runs while prerendering, where there is no window on globalThis.
        this.document.defaultView?.requestAnimationFrame(() => this.focusFirst());
      } else {
        this.previouslyFocused?.focus();
        this.previouslyFocused = null;
      }
    });
  }

  close(): void {
    this.sidebar.close();
  }

  /**
   * Keeps Tab inside the panel while it is open.
   *
   * Without it the keyboard walks straight out of a dialog that has told the screen
   * reader there is nothing out there, which leaves the user reading silence.
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.isOpen()) {
      return;
    }

    const stops = this.focusableStops();
    if (stops.length === 0) {
      return;
    }

    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = this.activeElement();

    if (event.shiftKey && (active === first || !stops.includes(active as HTMLElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusFirst(): void {
    this.focusableStops()[0]?.focus();
  }

  private focusableStops(): HTMLElement[] {
    const panel = this.panel()?.nativeElement;
    return panel ? Array.from(panel.querySelectorAll<HTMLElement>(SidebarModalComponent.FOCUSABLE)) : [];
  }

  private activeElement(): HTMLElement | null {
    const active = this.document.activeElement;
    return active instanceof HTMLElement ? active : null;
  }
}
