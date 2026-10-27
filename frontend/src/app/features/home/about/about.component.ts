import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-about',
  imports: [IconComponent, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  host: {
    '[class.about--spaced]': 'spacedTop()',
  },
})
export class AboutComponent {
  /** On the home page the feature strip supplies the gap above; elsewhere this does. */
  readonly spacedTop = input(false);

  readonly points: string[] = [
    $localize`:@@about.point.1:Big jobs, small jobs and last-minute jobs`,
    $localize`:@@about.point.2:Directly employed, insured and vetted staff`,
    $localize`:@@about.point.3:One point of contact from quote to completion`,
    $localize`:@@about.point.4:Fixed pricing agreed before work begins`,
  ];
}
