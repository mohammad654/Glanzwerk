import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PROJECTS, projectPath } from '../../../core/project-catalog';

@Component({
  selector: 'app-projects',
  imports: [RouterLink],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  // See hero.component.ts: Swiper rewrites its own DOM, so hydration is skipped.
  host: { ngSkipHydration: '' },
})
export class ProjectsComponent {
  readonly projects = PROJECTS;

  path(slug: string): string {
    return '/' + projectPath(slug);
  }
}
