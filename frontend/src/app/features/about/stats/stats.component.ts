import { Component } from '@angular/core';

interface Stat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent {
  // Placeholder figures — replace with Glanzwerk's real numbers before launch.
  readonly stats: Stat[] = [
    { value: '12', label: $localize`:@@stats.1:Years in building services` },
    { value: '140+', label: $localize`:@@stats.2:Sites under contract` },
    { value: '60', label: $localize`:@@stats.3:Directly employed staff` },
    { value: '98%', label: $localize`:@@stats.4:Contract renewal rate` },
  ];
}
