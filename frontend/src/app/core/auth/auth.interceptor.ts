import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

import { API_BASE_URL } from '../build-env';
import { AuthService } from './auth.service';

/** Endpoints that must never carry a bearer token or trigger a refresh of one. */
const PUBLIC_PATHS = ['auth/login', 'auth/register', 'auth/refresh', 'auth/logout'];

/**
 * Our own API, and not a path that merely starts with the same characters —
 * `/api/v1x/...` is somebody else's.
 */
const isApiCall = (url: string): boolean =>
  url === API_BASE_URL || url.startsWith(`${API_BASE_URL}/`);

/**
 * Matched against the path alone, and as a whole segment.
 *
 * This used to be `url.includes(path)` over the full URL, which also matched the query
 * string: searching the dashboard for the text `auth/login` sent
 * `?query=auth/login`, and the request lost its bearer token and came back 401. A
 * search box must not be able to decide whether a call is authenticated.
 */
const isPublic = (url: string): boolean => {
  const path = url.split(/[?#]/, 1)[0].replace(`${API_BASE_URL}/`, '');
  return PUBLIC_PATHS.includes(path);
};

/**
 * Attaches the access token, and retries once through a refresh when it has expired.
 *
 * The refresh is deliberately not a general retry: only a 401 on an API call that
 * carried a token is retried, and only once. A 401 from the login endpoint means the
 * password was wrong, and refreshing on it would turn a wrong password into a
 * confusing second request; a 403 means the role is wrong, which no new token fixes.
 *
 * `AuthService.restore()` single-flights the refresh itself, so several calls failing
 * together do not produce several refreshes.
 */
export const authInterceptor = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);

  if (!isApiCall(request.url) || isPublic(request.url)) {
    return next(request);
  }

  const authorized = (token: string | null): HttpRequest<unknown> =>
    token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authorized(auth.token)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap((session) =>
          session ? next(authorized(session.accessToken)) : throwError(() => error),
        ),
      );
    }),
  );
};
