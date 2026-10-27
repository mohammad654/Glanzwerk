import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';

/**
 * `busy` covers the screen, `wiping` plays the exit animation, `idle` is out of
 * the way. The overlay only has to render what it is told.
 */
export type LoadingPhase = 'idle' | 'busy' | 'wiping';

/** Under this, a navigation lands before anyone notices — a flash would read as a glitch. */
const GRACE_MS = 150;

/** Matches the exit animation in screen-wipe.component.scss. */
const WIPE_MS = 620;

const SETTLED_EVENTS = [NavigationEnd, NavigationCancel, NavigationError, NavigationSkipped];

/**
 * Turns router events into the three states the loading overlay can be in. The
 * overlay stays a pure view: all of the timing lives here.
 */
@Injectable({ providedIn: 'root' })
export class RouteLoadingService {
  private readonly phaseState = signal<LoadingPhase>('idle');
  private readonly passState = signal(0);

  readonly phase = this.phaseState.asReadonly();

  /** Counts the navigations that were slow enough to show, so each gets its own line. */
  readonly pass = this.passState.asReadonly();

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Nothing to react to while prerendering, and a pending timer would outlive the render.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return;
    }

    const subscription = inject(Router).events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.showAfterGrace();
      } else if (SETTLED_EVENTS.some((settled) => event instanceof settled)) {
        this.settle();
      }
    });

    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
      clearTimeout(this.timer);
    });
  }

  private showAfterGrace(): void {
    this.restartTimer(() => {
      this.phaseState.set('busy');
      this.passState.update((pass) => pass + 1);
    }, GRACE_MS);
  }

  private settle(): void {
    if (this.phaseState() !== 'busy') {
      // Landed inside the grace window: cancel the reveal instead of flashing it.
      clearTimeout(this.timer);
      this.phaseState.set('idle');
      return;
    }

    this.phaseState.set('wiping');
    this.restartTimer(() => this.phaseState.set('idle'), WIPE_MS);
  }

  private restartTimer(action: () => void, delayMs: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(action, delayMs);
  }
}
