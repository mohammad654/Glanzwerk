import { Component } from '@angular/core';

import { AboutComponent } from './about/about.component';
import { AppointmentComponent } from './appointment/appointment.component';
import { FeatureStripComponent } from './feature-strip/feature-strip.component';
import { HeroComponent } from './hero/hero.component';
import { ServicesComponent } from './services/services.component';
import { StatsComponent } from '../about/stats/stats.component';
import { WhyUsComponent } from './why-us/why-us.component';

@Component({
  selector: 'app-home',
  imports: [
    HeroComponent,
    FeatureStripComponent,
    AboutComponent,
    StatsComponent,
    ServicesComponent,
    WhyUsComponent,
    AppointmentComponent,
  ],
  template: `
    <app-hero />
    <app-feature-strip />
    <app-about />
    <app-stats />
    <app-services />
    <app-why-us />
    <app-appointment />
  `,
})
export class HomeComponent {}
