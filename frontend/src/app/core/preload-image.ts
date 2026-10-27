/**
 * Adds a high-priority preload hint for an image the browser cannot discover on
 * its own — a CSS background, typically. Called while prerendering it lands in
 * that page's static HTML, so only the pages that need the image ask for it.
 */
export const preloadImage = (document: Document, href: string): void => {
  const selector = `link[rel="preload"][href="${href}"]`;
  if (document.head.querySelector(selector)) {
    return;
  }

  const link = document.createElement('link');
  // setAttribute throughout: the prerender DOM does not reflect every one of
  // these as a property, and a preload without `as` is one the browser ignores.
  link.setAttribute('rel', 'preload');
  link.setAttribute('as', 'image');
  link.setAttribute('href', href);
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
};
