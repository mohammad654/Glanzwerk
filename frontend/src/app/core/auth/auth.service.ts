import { HttpClient } from '@angular/common/http';
import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, firstValueFrom, of, tap } from 'rxjs';

import { api } from '../api/api';
import { API_BASE_URL } from '../build-env';
import {
  AuthUser,
  Credentials,
  PasswordReset,
  Registration,
  Role,
  SessionResponse,
} from './session';

/**
 * Set beside the HttpOnly refresh cookie and readable here, saying only that the
 * refresh cookie exists. Must match `HINT_NAME` in the backend's `RefreshCookies`.
 */
const SESSION_HINT_COOKIE = 'glanzwerkSession';

/**
 * The signed-in session.
 *
 * The access token lives in a private field and never in `localStorage` or a
 * JavaScript-readable cookie. That is the whole design: an injected script can read
 * web storage, so a token kept there is a token an XSS can steal and replay for its
 * full lifetime. In memory it dies with the tab, and the only thing that survives a
 * reload is the HttpOnly refresh cookie, which the browser will hand to
 * `/api/v1/auth/refresh` and to nothing else.
 *
 * The cost is that a reload starts with no token, which `restore()` covers: it is
 * called once per page load, by the route guards and by `provideSessionRestore`.
 *
 * `restore()` needs to know whether asking is worth it, and it cannot read the
 * HttpOnly cookie to find out — so the server writes a second, deliberately readable
 * cookie next to it saying only that it exists. Without that, every visitor to every
 * page spent a request on `/auth/refresh` and collected a 401, which is the answer for
 * almost all of them. The hint authorises nothing; it only decides whether to ask.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  // Injected rather than global: this service is constructed during the prerender.
  private readonly document = inject(DOCUMENT);

  private accessToken: string | null = null;

  private readonly currentUser = signal<AuthUser | null>(null);

  /** Whether `restore()` has already run, so a reload refreshes at most once. */
  private restored: Promise<void> | null = null;

  readonly user = this.currentUser.asReadonly();
  readonly isSignedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  /** The bearer value for the interceptor, or null when there is no session. */
  get token(): string | null {
    return this.accessToken;
  }

  hasRole(role: Role): boolean {
    return this.currentUser()?.role === role;
  }

  login(credentials: Credentials): Observable<SessionResponse> {
    // withCredentials so the browser accepts the Set-Cookie for the refresh token.
    return this.http
      .post<SessionResponse>(api('auth/login'), credentials, { withCredentials: true })
      .pipe(tap((session) => this.adopt(session)));
  }

  register(registration: Registration): Observable<AuthUser> {
    // Returns the account, not a session: the caller signs in afterwards, so there is
    // one code path that mints tokens.
    return this.http.post<AuthUser>(api('auth/register'), registration);
  }

  /**
   * Asks for a reset link. Answers with nothing: what happens next is an email, not
   * a response body.
   */
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(api('auth/forgot-password'), { email });
  }

  /**
   * Redeems a reset link. It deliberately does not sign the account in — the new
   * password is typed into the sign-in form once, which proves it arrived intact and
   * gets it into the browser's password manager.
   */
  resetPassword(reset: PasswordReset): Observable<void> {
    return this.http.post<void>(api('auth/reset-password'), reset);
  }

  /** Exchanges the refresh cookie for a new access token. */
  refresh(): Observable<SessionResponse | null> {
    return this.http
      .post<SessionResponse>(api('auth/refresh'), null, { withCredentials: true })
      .pipe(
        tap((session) => this.adopt(session)),
        catchError(() => {
          this.clear();
          return of(null);
        }),
      );
  }

  /**
   * Restores a session after a page load, at most once per app instance.
   *
   * The promise is cached rather than the result, so several guards resolving at the
   * same time share one request instead of racing three refreshes. When the hint
   * cookie says there is no session to restore, nothing is requested at all.
   */
  restore(): Promise<void> {
    if (!this.mightHaveSession()) {
      this.restored ??= Promise.resolve();
      return this.restored;
    }

    this.restored ??= firstValueFrom(this.refresh()).then(() => undefined);
    return this.restored;
  }

  async logout(): Promise<void> {
    try {
      // Clears the cookie server-side. The local state is dropped either way: a
      // failed request must not leave the user looking signed in.
      await firstValueFrom(this.http.post(api('auth/logout'), null, { withCredentials: true }));
    } catch {
      // Already gone, or the server is unreachable. Nothing left to do here.
    } finally {
      this.clear();
      this.restored = Promise.resolve();
    }
  }

  private adopt(session: SessionResponse): void {
    this.accessToken = session.accessToken;
    this.currentUser.set(session.user);
    this.restored = Promise.resolve();
  }

  private clear(): void {
    this.accessToken = null;
    this.currentUser.set(null);
    this.forgetSessionHint();
  }

  /**
   * Whether a refresh is worth attempting.
   *
   * Only the hint cookie's presence is consulted, never its value — it is not a
   * credential and nothing is authorised by it. A wrong answer here costs a visitor
   * nothing worse than looking signed out until they sign in again.
   *
   * The same-origin check is what keeps this honest: an API on another origin sets the
   * hint as a cross-site cookie this page cannot read, so rather than leaving those
   * deployments permanently unable to restore a session, the optimisation switches
   * itself off and every page load asks as it did before.
   */
  private mightHaveSession(): boolean {
    const apiIsSameOrigin = API_BASE_URL.startsWith('/');
    return !apiIsSameOrigin || this.document.cookie.includes(`${SESSION_HINT_COOKIE}=`);
  }

  /**
   * Drops the hint once the server has told us the session is gone.
   *
   * The server clears it on sign-out, but a refresh can also fail because the cookie
   * expired or was revoked, and a stale hint would make every later page load ask
   * again and collect the same 401.
   */
  private forgetSessionHint(): void {
    this.document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}
