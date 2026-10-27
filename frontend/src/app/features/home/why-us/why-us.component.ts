import { Component } from '@angular/core';

interface Commitment {
  title: string;
  text: string;
}

@Component({
  selector: 'app-why-us',
  templateUrl: './why-us.component.html',
  styleUrl: './why-us.component.scss',
})
export class WhyUsComponent {
  readonly commitments: Commitment[] = [
    {
      title: $localize`:@@whyUs.1.title:A specification you can hold us to`,
      text: $localize`:@@whyUs.1.text:Every contract starts with a written schedule of tasks and frequencies. The standard is defined in advance, so it can be measured.`,
    },
    {
      title: $localize`:@@whyUs.2.title:A fixed team on your site`,
      text: $localize`:@@whyUs.2.text:The same trained staff attend each visit under a named supervisor. They learn the building, and nobody has to be shown around twice.`,
    },
    {
      title: $localize`:@@whyUs.3.title:Quality checks you can read`,
      text: $localize`:@@whyUs.3.text:Supervisors carry out documented quality walks and report monthly, so problems surface in the review before your tenants raise them.`,
    },
    {
      title: $localize`:@@whyUs.4.title:Properly employed, properly insured`,
      text: $localize`:@@whyUs.4.text:Our staff are directly employed, trained and fully insured. There is no subcontracting chain, so you always know who is in your building.`,
    },
  ];
}
