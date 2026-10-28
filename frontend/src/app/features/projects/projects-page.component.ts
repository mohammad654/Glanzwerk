import { Component } from '@angular/core';

import { PROJECTS } from '../../core/project-catalog';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';

@Component({
  selector: 'app-projects-page',
  imports: [PageBannerComponent, ProjectCardComponent],
  template: `
    <app-page-banner [title]="pageTitle" />

    <section class="projects-grid">
      <div class="container">
        <div class="row g-4">
          @for (project of projects; track project.key) {
            <div class="col-lg-4 col-md-6">
              <app-project-card [project]="project" />
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    @use 'abstracts/variables' as v;

    .projects-grid {
      padding: v.$section-padding-y 0;
    }
  `,
})
export class ProjectsPageComponent {
  readonly pageTitle = $localize`:@@page.references.h1:References`;

  readonly projects = PROJECTS;
}
