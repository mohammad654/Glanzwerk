import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app.component';
import { NAV_ITEMS } from './core/navigation';
import { SERVICES } from './core/service-catalog';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the header bars', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.top-bar')).toBeTruthy();
    expect(compiled.querySelector('.site-nav__brand img')).toBeTruthy();
    expect(compiled.querySelectorAll('.site-nav__menu > li').length).toBe(NAV_ITEMS.length);
    expect(compiled.querySelectorAll('.site-nav__dropdown a').length).toBe(SERVICES.length);
  });
});
