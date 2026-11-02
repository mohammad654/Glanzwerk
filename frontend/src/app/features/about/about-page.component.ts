import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AboutComponent } from '../home/about/about.component';
import { ProcessComponent } from '../home/process/process.component';
import { WhyUsComponent } from '../home/why-us/why-us.component';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { StatsComponent } from './stats/stats.component';
import { TestimonialsComponent } from '../home/testimonials/testimonials.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-about-page',
  imports: [
    PageBannerComponent,
    AboutComponent,
    StatsComponent,
    WhyUsComponent,
    ProcessComponent,
    TestimonialsComponent,
  ],
  template: `
    <app-page-banner [title]="pageTitle" />
    <app-about [spacedTop]="true" />
    <app-stats />
    <app-why-us />
    <app-process />
    <app-testimonials />
  `,
})
export class AboutPageComponent {
  readonly pageTitle = $localize`:@@page.about.h1:About Glanzwork`;
}
