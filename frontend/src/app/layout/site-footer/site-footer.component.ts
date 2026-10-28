import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ADDRESS_LINE, COMPANY, SOCIAL_LINKS } from '../../core/company';
import { linkTo, pathIn } from '../../core/i18n/localized-path';
import { NAV_ITEMS, navLink } from '../../core/navigation';
import { STATIC_ROUTES } from '../../core/routes';
import { SERVICES, serviceLink } from '../../core/service-catalog';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-site-footer',
  imports: [IconComponent, RouterLink],
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
    path: serviceLink(service),
  }));

  // Reuses the header's labels so the two menus cannot disagree in either language.
  readonly quickLinks = NAV_ITEMS.filter((item) => pathIn(item.path) !== '').map((item) => ({
    label: item.label,
    path: navLink(item),
  }));

  /**
   * Pages the header deliberately leaves out. Impressum and Datenschutzerklärung are
   * required by German law and are conventionally found in the footer.
   */
  readonly secondaryLinks = [
    {
      label: $localize`:@@page.serviceArea.title:Service Area`,
      path: linkTo(STATIC_ROUTES.serviceArea),
    },
    { label: $localize`:@@page.jobs.title:Jobs`, path: linkTo(STATIC_ROUTES.jobs) },
    { label: $localize`:@@page.imprint.title:Imprint`, path: linkTo(STATIC_ROUTES.imprint) },
    { label: $localize`:@@page.privacy.title:Privacy Policy`, path: linkTo(STATIC_ROUTES.privacy) },
  ];
}
