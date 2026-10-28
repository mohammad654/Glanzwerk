import { Component } from '@angular/core';

import { ProcessComponent } from '../home/process/process.component';
import { ServicesComponent } from '../home/services/services.component';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';

@Component({
  selector: 'app-services-page',
  imports: [PageBannerComponent, ServicesComponent, ProcessComponent],
  template: `
    <app-page-banner [title]="pageTitle" />
    <app-services [spacedTop]="true" />
    <app-process />
  `,
})
export class ServicesPageComponent {
  readonly pageTitle = $localize`:@@page.services.h1:Our Services`;
}
