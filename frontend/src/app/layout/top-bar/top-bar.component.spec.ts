import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { SessionResponse } from '../../core/auth/session';
import { TopBarComponent } from './top-bar.component';

const session = (role: 'ADMIN' | 'CLIENT', name: string): SessionResponse => ({
  accessToken: 'access-1',
  expiresIn: 900,
  user: {
    id: 1,
    name,
    email: 'someone@example.de',
    phone: null,
    role,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
});

/**
 * The bar used to render "Sign In" unconditionally, so somebody who had just created
 * an account was still being invited to sign in.
 */
describe('TopBarComponent', () => {
  let http: HttpTestingController;
  let auth: AuthService;

  const createComponent = () => {
    TestBed.configureTestingModule({
      imports: [TopBarComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);

    const fixture = TestBed.createComponent(TopBarComponent);
    fixture.detectChanges();
    return fixture;
  };

  /** Signs in through the service, so the component sees the real session state. */
  const signIn = (role: 'ADMIN' | 'CLIENT', name = 'Probe Client') => {
    auth.login({ email: 'someone@example.de', password: 'Sicher123' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(session(role, name));
  };

  it('offers a sign-in link while nobody is signed in', () => {
    const fixture = createComponent();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Sign In');
    expect(text).not.toContain('Sign Out');
  });

  it('shows the first name and a sign-out button once signed in', () => {
    const fixture = createComponent();

    signIn('CLIENT', 'Probe Client');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Probe');
    expect(text).toContain('Sign Out');
    expect(text).not.toContain('Sign In');
  });

  it('points a client at their account and an administrator at the dashboard', () => {
    const fixture = createComponent();

    signIn('CLIENT');
    expect(fixture.componentInstance.accountLink()).toBe('/account');

    void auth.logout();
    http.expectOne('/api/v1/auth/logout').flush(null);

    signIn('ADMIN');
    expect(fixture.componentInstance.accountLink()).toBe('/admin');
  });

  afterEach(() => http.verify());
});
