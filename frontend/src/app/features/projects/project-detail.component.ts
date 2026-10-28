import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LINKS, STATIC_ROUTES } from '../../core/routes';
import { pathIn } from '../../core/i18n/localized-path';
import { PROJECTS, projectLink } from '../../core/project-catalog';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CATALOGUE_IMAGE } from '../../core/media';

@Component({
  selector: 'app-project-detail',
  imports: [IconComponent, PageBannerComponent, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  readonly notFoundTitle = $localize`:@@notFound.project:Reference not found`;

  /** Reserves the photo\'s space before it loads. */
  readonly imageSize = CATALOGUE_IMAGE;

  /** Static-page links, so no template spells a URL out. */
  readonly links = LINKS;

  /** Bound from the route's `data.key`. Keys are locale-independent; URLs are not. */
  readonly key = input.required<string>();

  readonly project = computed(() => PROJECTS.find((project) => project.key === this.key()));

  readonly others = computed(() =>
    PROJECTS.filter((project) => project.key !== this.key()).slice(0, 4),
  );

  readonly trail = [
    { label: $localize`:@@nav.references:References`, path: pathIn(STATIC_ROUTES.references) },
  ];

  /** Catalogue routes come from the catalogue, so no page spells one out. */
  readonly path = projectLink;
}
