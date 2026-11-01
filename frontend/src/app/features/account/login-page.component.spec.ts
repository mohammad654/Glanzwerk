import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SessionResponse } from '../../core/auth/session';
import { LoginPageComponent } from './login-page.component';

const session = (role: 'ADMIN' | 'CLIENT'): SessionResponse => ({
  accessToken: 'access-1',
  expiresIn: 900,
  user: {
    id: 1,
    name: 'Someone',
    email: 'someone@example.de',
    phone: null,
    role,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
});

/** Somewhere for the router to land. The destinations are what is under test. */
@Component({ template: '' })
class StubPage {}

const ROUTES = [
  { path: 'login', component: StubPage },
  { path: 'register', component: StubPage },
  { path: 'forgot-password', component: StubPage },
  { path: 'account', component: StubPage },
  { path: 'admin', component: StubPage },
  { path: 'admin/bookings', component: StubPage },
];

describe('LoginPageComponent', () => {
  let http: HttpTestingController;
  let router: Router;

  const createComponent = async (url = '/login') => {
    TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [provideRouter(ROUTES), provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    await router.navigateByUrl(url);

    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    return fixture;
  };

  const submitValid = (fixture: Awaited<ReturnType<typeof createComponent>>) => {
    fixture.componentInstance.form.setValue({
      email: 'someone@example.de',
      password: 'Sicher123',
    });
    fixture.componentInstance.submit();
  };

  it('sends nothing until the form is valid', async () => {
    const fixture = await createComponent();

    fixture.componentInstance.submit();

    http.verify();
    expect(fixture.componentInstance.pending()).toBe(false);
  });

  it('shows the server message when the credentials are wrong', async () => {
    const fixture = await createComponent();
    submitValid(fixture);

    http.expectOne('/api/v1/auth/login').flush(
      { status: 401, message: 'Email or password is incorrect.', path: '/api/v1/auth/login' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.errorMessage()).toBe('Email or password is incorrect.');
    expect(fixture.componentInstance.pending()).toBe(false);
    http.verify();
  });

  it('puts an unknown address under the email box and offers to register', async () => {
    const fixture = await createComponent();
    submitValid(fixture);

    http.expectOne('/api/v1/auth/login').flush(
      {
        status: 401,
        message: 'No account is registered with that email address.',
        path: '/api/v1/auth/login',
        fieldErrors: { email: 'No account is registered with that email address.' },
      },
      { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.serverError('email')).toBe(
      'No account is registered with that email address.',
    );
    expect(fixture.componentInstance.unknownEmail()).toBe(true);
    // Not also in the alert above the form: one message, one place.
    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });

  it('puts a wrong password under the password box and nowhere else', async () => {
    const fixture = await createComponent();
    submitValid(fixture);

    http.expectOne('/api/v1/auth/login').flush(
      {
        status: 401,
        message: 'The password is incorrect.',
        path: '/api/v1/auth/login',
        fieldErrors: { password: 'The password is incorrect.' },
      },
      { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();

    expect(fixture.componentInstance.serverError('password')).toBe('The password is incorrect.');
    expect(fixture.componentInstance.unknownEmail()).toBe(false);
    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });

  it('drops the error as soon as the user edits the form', async () => {
    const fixture = await createComponent();
    submitValid(fixture);

    http.expectOne('/api/v1/auth/login').flush(
      {
        status: 401,
        message: 'The password is incorrect.',
        path: '/api/v1/auth/login',
        fieldErrors: { password: 'The password is incorrect.' },
      },
      { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();
    expect(fixture.componentInstance.serverError('password')).toBeDefined();

    fixture.componentInstance.form.controls.password.setValue('Sicher1234');

    // The message described what was sent. It no longer does, so it is gone — without
    // another submit, which is what made it feel stuck.
    expect(fixture.componentInstance.serverError('password')).toBeUndefined();
    expect(fixture.componentInstance.failure()).toBeNull();
  });

  it('sends the sign-in with credentials, so the refresh cookie is accepted', async () => {
    const fixture = await createComponent();
    submitValid(fixture);

    const request = http.expectOne('/api/v1/auth/login');
    expect(request.request.withCredentials).toBe(true);
    request.flush(session('CLIENT'));
    await fixture.whenStable();

    http.verify();
  });

  it('sends an administrator to the dashboard and a client to their appointments', async () => {
    const admin = await createComponent();
    submitValid(admin);
    http.expectOne('/api/v1/auth/login').flush(session('ADMIN'));
    await admin.whenStable();
    expect(router.url).toBe('/admin');

    TestBed.resetTestingModule();

    const client = await createComponent();
    submitValid(client);
    http.expectOne('/api/v1/auth/login').flush(session('CLIENT'));
    await client.whenStable();
    expect(router.url).toBe('/account');
  });

  it('follows a returnUrl that points back into this site', async () => {
    const fixture = await createComponent('/login?returnUrl=%2Fadmin%2Fbookings');
    submitValid(fixture);

    http.expectOne('/api/v1/auth/login').flush(session('ADMIN'));
    await fixture.whenStable();

    expect(router.url).toBe('/admin/bookings');
  });

  it('refuses an absolute returnUrl, so the page cannot be used as an open redirect', async () => {
    const fixture = await createComponent('/login?returnUrl=https:%2F%2Fevil.example%2Fsteal');
    submitValid(fixture);

    http.expectOne('/api/v1/auth/login').flush(session('ADMIN'));
    await fixture.whenStable();

    // A phishing link that really does sign you in and then drops you elsewhere is
    // the attack this guards against. The role's own landing page wins instead.
    expect(router.url).toBe('/admin');
  });

  it('refuses a protocol-relative returnUrl, which is the same attack without a scheme', async () => {
    const fixture = await createComponent('/login?returnUrl=%2F%2Fevil.example%2Fsteal');
    submitValid(fixture);

    http.expectOne('/api/v1/auth/login').flush(session('CLIENT'));
    await fixture.whenStable();

    expect(router.url).toBe('/account');
  });
});
