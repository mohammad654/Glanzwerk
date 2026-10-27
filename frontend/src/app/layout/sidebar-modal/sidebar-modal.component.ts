import { DOCUMENT, Component, effect, inject } from '@angular/core';

import { COMPANY, SOCIAL_LINKS } from '../../core/company';
import { SERVICES } from '../../core/service-catalog';
import { SidebarService } from '../../core/services/sidebar.service';

@Component({
  selector: 'app-sidebar-modal',
  templateUrl: './sidebar-modal.component.html',
  styleUrl: './sidebar-modal.component.scss',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class SidebarModalComponent {
  private readonly sidebar = inject(SidebarService);
  // Injected rather than global: this effect also runs while prerendering,
  // where there is no document on globalThis.
  private readonly document = inject(DOCUMENT);

  readonly company = COMPANY;
  readonly socials = SOCIAL_LINKS;
  readonly isOpen = this.sidebar.isOpen;

  readonly highlights = SERVICES.map((service) => ({
    icon: service.icon,
    label: service.shortTitle,
  }));

  constructor() {
    // The page behind the panel should not scroll while it is open.
    effect(() => {
      this.document.body.style.overflow = this.isOpen() ? 'hidden' : '';
    });
  }

  close(): void {
    this.sidebar.close();
  }
}
