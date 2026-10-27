/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { register as registerSwiperElements } from 'swiper/element/bundle';

import { appConfig } from './app/app.config';
import { App } from './app/app.component';

// Registers <swiper-container> / <swiper-slide> as custom elements once, for
// every carousel in the app.
registerSwiperElements();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
