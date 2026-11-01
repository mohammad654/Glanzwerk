import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ResetPasswordPageComponent } from './reset-password-page.component';

/** Somewhere for the "ask for a new link" buttons to point. */
@Component({ template: '' })
class StubPage {}

const ROUTES = [
  { path: 'login', component: StubPage },
  { path: 'reset-password', component: ResetPasswordPageComponent },
  { path: 'forgot-password', component: StubPage },
];

describe('ResetPasswordPageComponent', () => {
  let http: HttpTestingController;

  const createComponent = async (url: string) => {
    TestBed.configureTestingModule({
      imports: [ResetPasswordPageComponent],
      providers: [provideRouter(ROUTES), provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    await TestBed.inject(Router).navigateByUrl(url);

    const fixture = TestBed.createComponent(ResetPasswordPageComponent);
    fixture.detectChanges();
    return fixture;
  };

  const fill = (
    fixture: Awaited<ReturnType<typeof createComponent>>,
    password: string,
    confirmation = password,
  ) => fixture.componentInstance.form.setValue({ password, confirmation });

  it('shows no form at all when the link carried no token', async () => {
    const fixture = await createComponent('/reset-password');

    expect(fixture.componentInstance.hasToken).toBe(false);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('sends the token from the link with the new password', async () => {
    const fixture = await createComponent('/reset-password?token=abc123');
    fill(fixture, 'Sicher123');

    fixture.componentInstance.submit();

    const request = http.expectOne('/api/v1/auth/reset-password');
    expect(request.request.body).toEqual({ token: 'abc123', password: 'Sicher123' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(fixture.componentInstance.done()).toBe(true);
    http.verify();
  });

  it('sends nothing when the two boxes disagree', async () => {
    const fixture = await createComponent('/reset-password?token=abc123');
    fill(fixture, 'Sicher123', 'Sicher124');

    fixture.componentInstance.submit();

    http.verify();
    expect(fixture.componentInstance.mismatch()).toBe(true);
  });

  it('sends nothing when the password breaks the policy', async () => {
    const fixture = await createComponent('/reset-password?token=abc123');
    fill(fixture, 'sicher');

    fixture.componentInstance.submit();

    http.verify();
    expect(fixture.componentInstance.done()).toBe(false);
  });

  it('shows the server sentence when the link has expired', async () => {
    const fixture = await createComponent('/reset-password?token=stale');
    fill(fixture, 'Sicher123');
    fixture.componentInstance.submit();

    http.expectOne('/api/v1/auth/reset-password').flush(
      {
        status: 400,
        message: 'This reset link is no longer valid. Please ask for a new one.',
        path: '/api/v1/auth/reset-password',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.errorMessage()).toBe(
      'This reset link is no longer valid. Please ask for a new one.',
    );
    expect(fixture.componentInstance.done()).toBe(false);
  });
});
