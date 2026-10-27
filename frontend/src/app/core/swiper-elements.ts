/**
 * Registers `<swiper-container>` / `<swiper-slide>` the first time a carousel
 * needs them. Loading Swiper from `main.ts` put it in the initial bundle for
 * every page, including the ones without a carousel; this keeps it on the route
 * that asks. The import is dynamic so the prerender build never touches it.
 */
let registration: Promise<void> | undefined;

export const registerSwiperElements = (): Promise<void> => {
  registration ??= import('swiper/element/bundle').then(({ register }) => register());
  return registration;
};
