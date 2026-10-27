import { Component } from '@angular/core';

import { COMPANY } from '../../../core/company';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface Feature {
  icon: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-feature-strip',
  imports: [IconComponent],
  templateUrl: './feature-strip.component.html',
  styleUrl: './feature-strip.component.scss',
})
export class FeatureStripComponent {
  readonly company = COMPANY;

  readonly features: Feature[] = [
    {
      icon: 'bi-lightning-charge',
      title: $localize`:@@feature.1.title:Last-Minute Ready`,
      text: $localize`:@@feature.1.text:Same-day and out-of-hours call-outs, including weekends.`,
    },
    {
      icon: 'bi-people',
      title: $localize`:@@feature.2.title:One Team, Many Jobs`,
      text: $localize`:@@feature.2.text:Cleaning, moving and clearance from one contractor.`,
    },
    {
      icon: 'bi-patch-check',
      title: $localize`:@@feature.3.title:Insured & Vetted`,
      text: $localize`:@@feature.3.text:Directly employed staff, fully insured and background-checked.`,
    },
  ];
}
