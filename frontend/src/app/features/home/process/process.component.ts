import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LINKS } from '../../../core/routes';

interface ProcessStep {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-process',
  imports: [IconComponent, RouterLink, DecimalPipe],
  templateUrl: './process.component.html',
  styleUrl: './process.component.scss',
})
export class ProcessComponent {
  /** Static-page links, so no template spells a URL out. */
  readonly links = LINKS;

  readonly steps: ProcessStep[] = [
    {
      icon: 'bi-telephone',
      title: $localize`:@@process.1.title:Site Survey`,
      text: $localize`:@@process.1.text:We visit the property, measure the areas and discuss how the building is actually used before quoting anything.`,
    },
    {
      icon: 'bi-file-earmark-text',
      title: $localize`:@@process.2.title:Specification & Quote`,
      text: $localize`:@@process.2.text:You receive a written schedule of tasks and frequencies alongside a fixed price, so the scope is clear from day one.`,
    },
    {
      icon: 'bi-arrow-repeat',
      title: $localize`:@@process.3.title:Delivery & Review`,
      text: $localize`:@@process.3.text:A fixed team starts on the agreed date under a named supervisor, with documented quality checks reported monthly.`,
    },
  ];
}
