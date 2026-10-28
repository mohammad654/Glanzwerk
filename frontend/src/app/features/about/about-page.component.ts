import { Component } from '@angular/core';

import { AboutComponent } from '../home/about/about.component';
import { ProcessComponent } from '../home/process/process.component';
import { WhyUsComponent } from '../home/why-us/why-us.component';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { StatsComponent } from './stats/stats.component';

@Component({
  selector: 'app-about-page',
  imports: [PageBannerComponent, AboutComponent, StatsComponent, WhyUsComponent, ProcessComponent],
  template: `
    <app-page-banner [title]="pageTitle" />
    <app-about [spacedTop]="true" />
    <app-stats />
    <app-why-us />
    <app-process />
  `,
})
export class AboutPageComponent {
  readonly pageTitle = $localize`:@@page.about.h1:About Glanzwork`;
}
