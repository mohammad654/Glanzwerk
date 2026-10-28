import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Project, projectLink } from '../../../core/project-catalog';
import { IconComponent } from '../icon/icon.component';
import { CATALOGUE_IMAGE } from '../../../core/media';

/**
 * One project card, shared by the home carousel and the projects grid. The look
 * lives in styles/components/_project-card.scss, which is global so both
 * contexts get it without duplicating the rules.
 */
@Component({
  selector: 'app-project-card',
  imports: [IconComponent, RouterLink],
  templateUrl: './project-card.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ProjectCardComponent {
  /** Reserves the photo\'s space before it loads. */
  readonly imageSize = CATALOGUE_IMAGE;

  readonly project = input.required<Project>();

  readonly link = computed(() => projectLink(this.project()));
}
