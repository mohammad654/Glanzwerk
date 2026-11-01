import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { localeInterceptor } from './core/api/locale.interceptor';
import { authInterceptor } from './core/auth/auth.interceptor';
import { provideSessionRestore } from './core/auth/provide-session-restore';
import { provideSeo } from './core/seo/provide-seo';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Route params arrive as component inputs instead of manual subscriptions.
      withComponentInputBinding(),
      // Without this, following a link keeps the previous page's scroll position.
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    // `withFetch` keeps the client off XHR, which also makes it work during the
    // prerender without a browser global. The interceptors state this build's
    // language and attach the access token, retrying once through a refresh when it
    // has expired — see `core/api/locale.interceptor.ts` and
    // `core/auth/auth.interceptor.ts`.
    provideHttpClient(withFetch(), withInterceptors([localeInterceptor, authInterceptor])),
    // Trades the refresh cookie for a token once per page load, so the public
    // chrome and the booking page know about a session the guards never see.
    provideSessionRestore(),
    provideSeo(),
    provideClientHydration(),
  ],
};
