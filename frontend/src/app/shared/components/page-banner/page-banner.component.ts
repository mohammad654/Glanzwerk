import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb {
  label: string;
  path: string;
}

@Component({
  selector: 'app-page-banner',
  imports: [RouterLink],
  templateUrl: './page-banner.component.html',
  styleUrl: './page-banner.component.scss',
})
export class PageBannerComponent {
  readonly title = input.required<string>();

  /** Anything between Home and the current page. */
  readonly trail = input<readonly Crumb[]>([]);
}
