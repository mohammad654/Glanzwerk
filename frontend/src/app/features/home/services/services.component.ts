import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SERVICES, serviceLink } from '../../../core/service-catalog';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-services',
  imports: [IconComponent, RouterLink],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
  host: {
    '[class.services--spaced]': 'spacedTop()',
  },
})
export class ServicesComponent {
  /** Pages without a section above this one supply their own top gap. */
  readonly spacedTop = input(false);

  readonly services = SERVICES;

  /** Catalog routes come from the catalog, so no page spells one out. */
  readonly path = serviceLink;
}
