import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { SessionResponse } from './session';

const HINT = 'glanzwerkSession';

const session = (): SessionResponse => ({
  accessToken: 'access-1',
  expiresIn: 900,
  user: {
    id: 1,
    name: 'A Client',
    email: 'client@example.de',
    phone: null,
    role: 'CLIENT',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
});

/**
 * `restore()` runs on every single page load, and the access token only ever lives in
 * memory — so without a readable signal the SPA had to ask `/auth/refresh` whether a
 * session existed, and collect a 401, for every visitor who has never signed in. The
 * hint cookie is that signal. These tests are the contract: ask when it is there,
 * stay quiet when it is not, and never let a stale one keep asking.
 */
describe('AuthService session restore', () => {
  let auth: AuthService;
  let backend: HttpTestingController;
  let cookie: string;

  beforeEach(() => {
    cookie = '';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          // A stand-in for document.cookie: jsdom's own is shared between tests and
          // cannot express "this browser has no cookies at all".
          provide: DOCUMENT,
          useValue: {
            get cookie() {
              return cookie;
            },
            set cookie(value: string) {
              cookie = /Max-Age=0/.test(value) ? '' : value;
            },
          },
        },
      ],
    });

    auth = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
  });

  it('does not ask the server when there is no hint cookie', async () => {
    await auth.restore();

    backend.expectNone('/api/v1/auth/refresh');
    expect(auth.isSignedIn()).toBe(false);
    backend.verify();
  });

  it('asks the server when the hint cookie is present', async () => {
    cookie = `${HINT}=1`;

    const restored = auth.restore();
    backend.expectOne('/api/v1/auth/refresh').flush(session());
    await restored;

    expect(auth.isSignedIn()).toBe(true);
    backend.verify();
  });

  it('asks only once however many guards call it', async () => {
    cookie = `${HINT}=1`;

    const first = auth.restore();
    const second = auth.restore();
    backend.expectOne('/api/v1/auth/refresh').flush(session());
    await Promise.all([first, second]);

    // Single-flighted: three guards resolving together must not race three refreshes.
    backend.verify();
  });

  it('drops a hint the server has disowned, so the next load does not ask again', async () => {
    cookie = `${HINT}=1`;

    const restored = auth.restore();
    backend
      .expectOne('/api/v1/auth/refresh')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await restored;

    expect(auth.isSignedIn()).toBe(false);
    // The cookie expired or was revoked; a stale hint would ask for ever.
    expect(cookie).not.toContain(HINT);
    backend.verify();
  });

  it('finds the hint among other cookies', async () => {
    cookie = `consent=yes; ${HINT}=1; other=3`;

    const restored = auth.restore();
    backend.expectOne('/api/v1/auth/refresh').flush(session());
    await restored;

    expect(auth.isSignedIn()).toBe(true);
    backend.verify();
  });

  it('clears the session and the hint on sign-out', async () => {
    cookie = `${HINT}=1`;

    const restored = auth.restore();
    backend.expectOne('/api/v1/auth/refresh').flush(session());
    await restored;
    expect(auth.isSignedIn()).toBe(true);

    const out = auth.logout();
    backend.expectOne('/api/v1/auth/logout').flush(null);
    await out;

    expect(auth.isSignedIn()).toBe(false);
    expect(auth.token).toBeNull();
    expect(cookie).not.toContain(HINT);
    backend.verify();
  });
});
