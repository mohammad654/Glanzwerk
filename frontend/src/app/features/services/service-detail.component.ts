import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { COMPANY } from '../../core/company';
import { SERVICES, findService, servicePath } from '../../core/service-catalog';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';

@Component({
  selector: 'app-service-detail',
  imports: [PageBannerComponent, RouterLink],
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss',
})
export class ServiceDetailComponent {
  /** Bound from the :slug route parameter. */
  readonly slug = input.required<string>();

  readonly service = computed(() => findService(this.slug()));

  readonly company = COMPANY;
  readonly allServices = SERVICES;
  readonly trail = [{ label: 'Services', path: 'services' }];

  path(slug: string): string {
    return '/' + servicePath(slug);
  }
}
