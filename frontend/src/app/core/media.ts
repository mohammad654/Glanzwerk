/**
 * Every catalogue photo — service, reference and advice — is generated at one size by
 * the image pipeline, so a single pair of width/height attributes fits all of them.
 *
 * The attributes are what stop the page reflowing as photos arrive. Without them the
 * browser cannot reserve space, and the layout shift counts against Core Web Vitals.
 */
export const CATALOGUE_IMAGE = { width: 1200, height: 800 } as const;
