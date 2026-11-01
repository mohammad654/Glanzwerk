import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CURRENT_LOCALE } from '../i18n/locales';
import { api } from './api';
import { localeInterceptor } from './locale.interceptor';

/**
 * The booking form offered "Office Cleaning" on the German site, because the API
 * localizes by `Accept-Language` and the browser sends the visitor's own preference.
 * Which build is being served is not something a visitor's language setting can say.
 */
describe('localeInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([localeInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('asks the API for this build’s language', () => {
    http.get(api('services')).subscribe();

    const request = backend.expectOne(api('services'));
    expect(request.request.headers.get('Accept-Language')).toBe(CURRENT_LOCALE);
    request.flush([]);
  });

  it('leaves everything that is not the API alone', () => {
    http.get('/assets/icons/sprite.svg', { responseType: 'text' }).subscribe();

    const request = backend.expectOne('/assets/icons/sprite.svg');
    expect(request.request.headers.has('Accept-Language')).toBe(false);
    request.flush('<svg></svg>');
  });

  it('does not overrule a caller that asked for a language itself', () => {
    http.get(api('services'), { headers: { 'Accept-Language': 'fr' } }).subscribe();

    const request = backend.expectOne(api('services'));
    expect(request.request.headers.get('Accept-Language')).toBe('fr');
    request.flush([]);
  });
});
