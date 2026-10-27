import { Component } from '@angular/core';

import { AboutComponent } from './about/about.component';
import { AppointmentComponent } from './appointment/appointment.component';
import { BlogComponent } from './blog/blog.component';
import { FeatureStripComponent } from './feature-strip/feature-strip.component';
import { HeroComponent } from './hero/hero.component';
import { ProcessComponent } from './process/process.component';
import { ProjectsComponent } from './projects/projects.component';
import { ServicesComponent } from './services/services.component';
import { WhyUsComponent } from './why-us/why-us.component';

@Component({
  selector: 'app-home',
  imports: [
    HeroComponent,
    FeatureStripComponent,
    AboutComponent,
    ServicesComponent,
    WhyUsComponent,
    ProcessComponent,
    ProjectsComponent,
    AppointmentComponent,
    BlogComponent,
  ],
  template: `
    <app-hero />
    <app-feature-strip />
    <app-about />
    <app-services />
    <app-why-us />
    <app-process />
    <app-projects />
    <app-appointment />
    <app-blog />
  `,
})
export class HomeComponent {}
