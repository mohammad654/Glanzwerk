import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { SessionResponse } from './session';

const session = (token: string): SessionResponse => ({
  accessToken: token,
  expiresIn: 900,
  user: {
    id: 1,
    name: 'Glanzwerk Administration',
    email: 'admin@glanzwerk.de',
    phone: null,
    role: 'ADMIN',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  /** Signs in through the real service so the token lands where the interceptor looks. */
  const signIn = (token = 'access-1') => {
    auth.login({ email: 'admin@glanzwerk.de', password: 'secret' }).subscribe();
    backend.expectOne('/api/v1/auth/login').flush(session(token));
  };

  it('attaches the access token to API calls', () => {
    signIn();

    http.get('/api/v1/admin/bookings').subscribe();

    const request = backend.expectOne('/api/v1/admin/bookings');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-1');
    request.flush({});
    backend.verify();
  });

  it('sends no Authorization header when nobody is signed in', () => {
    http.get('/api/v1/services').subscribe();

    const request = backend.expectOne('/api/v1/services');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
    backend.verify();
  });

  it('never attaches a token to the sign-in call', () => {
    signIn();

    // A second login while already signed in must not carry the old bearer token.
    auth.login({ email: 'someone@example.de', password: 'secret' }).subscribe();

    const request = backend.expectOne('/api/v1/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(session('access-2'));
    backend.verify();
  });

  it('leaves calls to other origins alone', () => {
    signIn();

    http.get('https://example.com/data').subscribe();

    const request = backend.expectOne('https://example.com/data');
    // Sending our bearer token to a third party would hand it the session.
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    backend.verify();
  });

  it('refreshes once on a 401 and retries with the new token', () => {
    signIn('expired');

    let body: unknown;
    http.get('/api/v1/admin/bookings').subscribe((value) => (body = value));

    backend
      .expectOne((request) => request.url === '/api/v1/admin/bookings')
      .flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });

    // The refresh goes out, using the cookie rather than a header.
    const refresh = backend.expectOne('/api/v1/auth/refresh');
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush(session('access-fresh'));

    const retry = backend.expectOne('/api/v1/admin/bookings');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer access-fresh');
    retry.flush({ items: [] });

    expect(body).toEqual({ items: [] });
    backend.verify();
  });

  it('gives up when the refresh also fails, instead of looping', () => {
    signIn('expired');

    let status: number | undefined;
    http.get('/api/v1/admin/bookings').subscribe({ error: (error) => (status = error.status) });

    backend
      .expectOne('/api/v1/admin/bookings')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/v1/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    // The original 401 reaches the caller, and there is no second refresh.
    expect(status).toBe(401);
    backend.verify();
  });

  it('still authenticates a call whose query string names a public path', () => {
    signIn();

    // The dashboard's search box goes out as ?query=..., and this used to be matched
    // with `url.includes('auth/login')` — so searching for that text silently stripped
    // the bearer token and the request came back 401.
    http.get('/api/v1/admin/appointments?query=auth/login').subscribe();

    const request = backend.expectOne('/api/v1/admin/appointments?query=auth/login');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-1');
    request.flush({ items: [] });
    backend.verify();
  });

  it('leaves a path that only starts like ours alone', () => {
    signIn();

    http.get('/api/v1x/elsewhere').subscribe();

    const request = backend.expectOne('/api/v1x/elsewhere');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
    backend.verify();
  });

  it('does not try to refresh a 403, which no new token would fix', () => {
    signIn();

    let status: number | undefined;
    http.get('/api/v1/admin/bookings').subscribe({ error: (error) => (status = error.status) });

    backend.expectOne('/api/v1/admin/bookings').flush({}, { status: 403, statusText: 'Forbidden' });

    expect(status).toBe(403);
    backend.verify();
  });

  it('forgets the session when a refresh fails', () => {
    signIn('expired');
    expect(auth.isSignedIn()).toBe(true);

    auth.refresh().subscribe();
    backend.expectOne('/api/v1/auth/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isSignedIn()).toBe(false);
    expect(auth.token).toBeNull();
    backend.verify();
  });
});
