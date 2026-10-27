import { Component, computed, inject } from '@angular/core';

import { RouteLoadingService } from '../../../core/services/route-loading.service';

/**
 * Cleaning jokes, one per navigation. The first is also what every prerendered
 * page carries, so the server and the client always agree on the opening line.
 */
const MESSAGES = [
  $localize`:@@wipe.message.1:Scrubbing the pixels…`,
  $localize`:@@wipe.message.2:Buffing out the fingerprints…`,
  $localize`:@@wipe.message.3:Chasing the last dust bunny…`,
  $localize`:@@wipe.message.4:Wringing out the sponge…`,
  $localize`:@@wipe.message.5:Fresh water, clean bucket…`,
  $localize`:@@wipe.message.6:Polishing the corners nobody checks…`,
] as const;

/** Decoration only — the foam carries them, so the count is a style decision. */
const BUBBLES = [1, 2, 3, 4, 5] as const;

/**
 * Soap foam that a squeegee pushes off the screen. It runs on boot from CSS
 * alone, so a reader without JavaScript still sees it clear, and again whenever
 * a navigation takes long enough to be worth admitting to.
 */
@Component({
  selector: 'app-screen-wipe',
  templateUrl: './screen-wipe.component.html',
  styleUrl: './screen-wipe.component.scss',
  host: {
    role: 'status',
    'aria-live': 'polite',
    '[class.is-busy]': "phase() === 'busy'",
    '[class.is-wiping]': "phase() === 'wiping'",
  },
})
export class ScreenWipeComponent {
  private readonly loading = inject(RouteLoadingService);

  readonly bubbles = BUBBLES;
  readonly phase = this.loading.phase;
  readonly message = computed(() => MESSAGES[this.loading.pass() % MESSAGES.length]);
}
