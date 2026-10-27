import { isPlatformBrowser } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, PLATFORM_ID, inject } from '@angular/core';

import { PROJECTS } from '../../../core/project-catalog';
import { registerSwiperElements } from '../../../core/swiper-elements';
import { ProjectCardComponent } from '../../../shared/components/project-card/project-card.component';

@Component({
  selector: 'app-projects',
  imports: [ProjectCardComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  // See hero.component.ts: Swiper rewrites its own DOM, so hydration is skipped.
  host: { ngSkipHydration: '' },
})
export class ProjectsComponent {
  readonly projects = PROJECTS;

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void registerSwiperElements();
    }
  }
}
