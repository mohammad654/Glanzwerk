import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { COMPANY } from '../../core/company';
import { trailFor } from '../../core/navigation';
import { faqsFor } from '../../core/service-faqs';
import { SERVICES, findServiceByKey, serviceLink, servicePath } from '../../core/service-catalog';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LINKS } from '../../core/routes';
import { CATALOGUE_IMAGE } from '../../core/media';

@Component({
  selector: 'app-service-detail',
  imports: [IconComponent, PageBannerComponent, RouterLink],
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss',
})
export class ServiceDetailComponent {
  readonly notFoundTitle = $localize`:@@notFound.service:Service not found`;

  /** Reserves the photo\'s space before it loads. */
  readonly imageSize = CATALOGUE_IMAGE;

  /** Static-page links, so no template spells a URL out. */
  readonly links = LINKS;

  /** Bound from the route's `data.key`. Keys are locale-independent; URLs are not. */
  readonly key = input.required<string>();

  readonly service = computed(() => findServiceByKey(this.key()));

  readonly faqs = computed(() => faqsFor(this.key()));

  readonly company = COMPANY;
  readonly allServices = SERVICES;

  /** Service pages sit at the site root, so the trail comes from the menu tree. */
  readonly trail = computed(() => {
    const service = this.service();
    return service ? trailFor(servicePath(service)) : [];
  });

  /** Catalogue routes come from the catalogue, so no page spells one out. */
  readonly path = serviceLink;
}
