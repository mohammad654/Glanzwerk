import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PROJECTS, projectPath } from '../../core/project-catalog';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';

@Component({
  selector: 'app-projects-page',
  imports: [PageBannerComponent, RouterLink],
  template: `
    <app-page-banner title="Projects" />

    <section class="projects-grid">
      <div class="container">
        <div class="row g-4">
          @for (project of projects; track project.slug) {
            <div class="col-lg-4 col-md-6">
              <article class="project">
                <a
                  class="project__media"
                  [routerLink]="path(project.slug)"
                  tabindex="-1"
                  aria-hidden="true"
                >
                  <img [src]="project.image" [alt]="project.title" loading="lazy" />
                </a>

                <div class="project__content">
                  <h3>
                    <a [routerLink]="path(project.slug)">{{ project.title }}</a>
                  </h3>
                  <span>{{ project.category }}</span>

                  <a
                    class="project__link"
                    [routerLink]="path(project.slug)"
                    [attr.aria-label]="'View ' + project.title"
                  >
                    <i class="bi bi-chevron-right" aria-hidden="true"></i>
                  </a>
                </div>
              </article>
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
  readonly projects = PROJECTS;

  path(slug: string): string {
    return '/' + projectPath(slug);
  }
}
