import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PROJECTS, findProject, projectLink } from '../../core/project-catalog';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-project-detail',
  imports: [IconComponent, PageBannerComponent, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  /** Bound from the :slug route parameter. */
  readonly slug = input.required<string>();

  readonly project = computed(() => findProject(this.slug()));

  readonly others = computed(() =>
    PROJECTS.filter((project) => project.slug !== this.slug()).slice(0, 4),
  );

  readonly trail = [{ label: 'Projects', path: 'projects' }];

  /** Catalog routes come from the catalog, so no page spells one out. */
  readonly path = projectLink;
}
