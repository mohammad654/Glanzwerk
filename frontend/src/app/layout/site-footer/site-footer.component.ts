import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ADDRESS_LINE, COMPANY, SOCIAL_LINKS } from '../../core/company';
import { NAV_ITEMS } from '../../core/navigation';
import { SERVICES, servicePath } from '../../core/service-catalog';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  readonly company = COMPANY;
  readonly addressLine = ADDRESS_LINE;
  readonly socials = SOCIAL_LINKS;
  readonly currentYear = new Date().getFullYear();

  readonly services = SERVICES.map((service) => ({
    label: service.shortTitle,
    path: '/' + servicePath(service.slug),
  }));

  // Reuses the header's labels so the two menus cannot disagree in either language.
  readonly quickLinks = NAV_ITEMS.filter((item) => item.path !== '').map((item) => ({
    label: item.label,
    path: '/' + item.path,
  }));
}
