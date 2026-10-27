import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface HeroSlide {
  eyebrow: string;
  title: string;
  text: string;
  image: string;
}

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  // Swiper clones and reorders slides on init, so the prerendered markup can
  // never match. The slides stay in the HTML for crawlers either way.
  host: { ngSkipHydration: '' },
})
export class HeroComponent {
  readonly slides: HeroSlide[] = [
    {
      eyebrow: $localize`:@@hero.1.eyebrow:Cleaning · Moving · Everything Between`,
      title: $localize`:@@hero.1.title:More Than Cleaning. More Than Expected.`,
      text: $localize`:@@hero.1.text:One team for cleaning, moving, clearance and the jobs that come up in between. You call, we turn up when we said we would.`,
      image: 'assets/images/hero/hero-team.jpg',
    },
    {
      eyebrow: $localize`:@@hero.2.eyebrow:Emergency & 24/7`,
      title: $localize`:@@hero.2.title:When It Cannot Wait Until Monday`,
      text: $localize`:@@hero.2.text:Same-day appointments, overnight shifts, weekends and holidays. Running out of time or facing a job too big to handle alone? Call us.`,
      image: 'assets/images/hero/hero-night-shift.jpg',
    },
    {
      eyebrow: $localize`:@@hero.3.eyebrow:Snow & Outdoor Services`,
      title: $localize`:@@hero.3.title:Cleared Before The Day Begins`,
      text: $localize`:@@hero.3.text:Snow clearing, gritting and outdoor care, with every deployment logged. That record is your evidence that the duty of care was met.`,
      image: 'assets/images/hero/hero-winter.jpg',
    },
  ];
}
