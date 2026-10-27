import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SERVICES, servicePath } from '../../../core/service-catalog';

@Component({
  selector: 'app-services',
  imports: [RouterLink],
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

  path(slug: string): string {
    return '/' + servicePath(slug);
  }
}
