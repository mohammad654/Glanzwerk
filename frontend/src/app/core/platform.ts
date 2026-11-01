import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Whether this is running in a browser rather than during the prerender.
 *
 * The site is built with `outputMode: "static"`: every public page is rendered at
 * build time, where there is no API to call and no server to proxy to one. A data
 * fetch that runs during the render fails for no reason and clutters the build output
 * with errors that look real. Pages that fetch on load ask this first.
 *
 * Must be called in an injection context.
 */
export const isBrowser = (): boolean => isPlatformBrowser(inject(PLATFORM_ID));
