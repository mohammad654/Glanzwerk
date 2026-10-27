import { Injectable, signal } from '@angular/core';

/** Shared open state for the slide-in sidebar: the navbar opens it, the panel reads it. */
@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly openState = signal(false);

  readonly isOpen = this.openState.asReadonly();

  open(): void {
    this.openState.set(true);
  }

  close(): void {
    this.openState.set(false);
  }
}
