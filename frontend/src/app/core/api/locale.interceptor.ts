import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../build-env';
import { CURRENT_LOCALE } from '../i18n/locales';

/**
 * Tells the API which language this build is in.
 *
 * The API localizes what it stores — a service name comes from `name_de` or
 * `name_en` — and chooses by `Accept-Language`. Left to the browser that header is
 * the *visitor's* preferred language, which has nothing to do with the build they
 * are reading: an English-preferring Chrome on `/de/` got a German page whose
 * booking form offered "Office Cleaning" and "Winter Service". The locale is a
 * property of the build, so it is stated rather than inferred.
 *
 * Only our own calls are touched, and the header is set rather than appended, so a
 * caller that needs another language can still say so.
 */
export const localeInterceptor = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (!request.url.startsWith(API_BASE_URL) || request.headers.has('Accept-Language')) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { 'Accept-Language': CURRENT_LOCALE } }));
};
