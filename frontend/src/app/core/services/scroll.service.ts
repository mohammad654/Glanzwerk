import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/**
 * The page's scroll offset, from one passive listener throttled to one read per
 * frame. Every `(window:scroll)` host binding is a separate non-passive handler
 * on the hottest path in the browser, so the whole app shares this one instead.
 */
@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly offsetState = signal(0);

  readonly offset = this.offsetState.asReadonly();

  private readonly view = inject(DOCUMENT).defaultView;

  constructor() {
    const view = this.view;

    // No window while prerendering: the offset stays 0, which is the top of the page.
    if (!view) {
      return;
    }

    let queued = false;
    const onScroll = (): void => {
      if (queued) {
        return;
      }

      queued = true;
      view.requestAnimationFrame(() => {
        queued = false;
        this.offsetState.set(view.scrollY);
      });
    };

    view.addEventListener('scroll', onScroll, { passive: true });
    inject(DestroyRef).onDestroy(() => view.removeEventListener('scroll', onScroll));
  }

  /** Smooth unless the reader has asked for less motion. */
  toTop(): void {
    const view = this.view;
    if (!view) {
      return;
    }

    const reduced = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
    view.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }
}
