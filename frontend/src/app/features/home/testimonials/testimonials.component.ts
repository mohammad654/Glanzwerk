import { isPlatformBrowser } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  inject,
  viewChild,
} from '@angular/core';

import { registerSwiperElements } from '../../../core/swiper-elements';
import { IconComponent } from '../../../shared/components/icon/icon.component';

/** Only what the arrows and the pacing touch, so Swiper's types stay out of here. */
interface SwiperControls {
  slidePrev(): void;
  slideNext(): void;
  params: { speed: number; autoplay: { delay: number } };
}

type SwiperContainer = HTMLElement & { swiper?: SwiperControls };

/**
 * The carousel takes its first step almost immediately and fast, because a
 * slider that has not moved by the time the section is read looks like three
 * static cards. Once it has been noticed it drops to a reading pace — the
 * template attributes hold the opening values, these are what it settles to.
 */
const STEADY_DELAY_MS = 7000;
const STEADY_SPEED_MS = 900;

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-testimonials',
  imports: [IconComponent],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  // Swiper clones and reorders slides on init, so the prerendered markup can
  // never match. The slides stay in the HTML for crawlers either way.
  host: { ngSkipHydration: '' },
})
export class TestimonialsComponent {
  private readonly slider = viewChild.required<ElementRef<SwiperContainer>>('slider');

  /** Five filled stars per card; the loop needs a list, not a count. */
  readonly stars = Array.from({ length: 5 });

  /**
   * Placeholder copy, in the same spirit as the about page's figures: these are
   * invented clients, not real ones. They are deliberately kept out of the
   * page's JSON-LD — `Review` markup for a quote nobody said is a Google policy
   * breach, not a styling detail.
   */
  readonly testimonials: Testimonial[] = [
    {
      quote: $localize`:@@testimonials.1.quote:The same two people have cleaned our offices for over a year now. They know which rooms are in use when, and we have not had to explain the building to anybody new since the day they started.`,
      name: $localize`:@@testimonials.1.name:Katrin Hoffmann`,
      role: $localize`:@@testimonials.1.role:Office Manager, Dresden-Neustadt`,
    },
    {
      quote: $localize`:@@testimonials.2.quote:We handed over a building site on the Friday and the client walked through it on the Monday. The written schedule meant nobody had to argue afterwards about what was included.`,
      name: $localize`:@@testimonials.2.name:Mark Richter`,
      role: $localize`:@@testimonials.2.role:Site Manager, Construction Firm`,
    },
    {
      quote: $localize`:@@testimonials.3.quote:The stairwells and the winter service are both on one contract, and the gritting log has already saved us one argument with an insurer. Calls are answered the same day.`,
      name: $localize`:@@testimonials.3.name:Susanne Baumann`,
      role: $localize`:@@testimonials.3.role:Property Management, Radebeul`,
    },
  ];

  private settled = false;

  /** Slows the slider down after that first attention-catching move. */
  settle(): void {
    const swiper = this.slider().nativeElement.swiper;
    if (this.settled || !swiper) {
      return;
    }

    this.settled = true;
    swiper.params.speed = STEADY_SPEED_MS;
    swiper.params.autoplay.delay = STEADY_DELAY_MS;
  }

  /** The arrows are ours rather than Swiper's, so they can sit in the heading row. */
  slide(direction: 'slidePrev' | 'slideNext'): void {
    this.slider().nativeElement.swiper?.[direction]();
  }

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void registerSwiperElements();
    }
  }
}
