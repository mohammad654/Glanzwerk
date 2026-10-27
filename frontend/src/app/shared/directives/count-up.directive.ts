import { DOCUMENT } from '@angular/common';
import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';

/** The figures are decoration, so one fixed timing beats an input per usage. */
const DURATION_MS = 1600;

/** Enough of the element on screen that the count is not missed mid-scroll. */
const VISIBLE_RATIO = 0.5;

const FIGURE_PATTERN = /^(\D*)(\d+)(.*)$/;

/** Slows as it lands, so the final number is the part that reads clearly. */
const easeOut = (progress: number): number => 1 - (1 - progress) ** 3;

export interface Figure {
  prefix: string;
  value: number;
  suffix: string;
}

/**
 * Splits a display figure into the part that counts and the characters around
 * it, so "140+" and "98%" keep their notation while the digits animate.
 */
export const parseFigure = (text: string | null | undefined): Figure | null => {
  const match = FIGURE_PATTERN.exec((text ?? '').trim());
  if (!match) {
    return null;
  }

  const [, prefix, digits, suffix] = match;
  return { prefix, value: Number(digits), suffix };
};

/**
 * Counts the element's own number up from zero the first time it scrolls into
 * view. The target is read from the rendered text, so the prerendered markup
 * carries the real figure for crawlers and for readers without JavaScript.
 */
@Directive({
  selector: '[appCountUp]',
})
export class CountUpDirective {
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private readonly view = inject(DOCUMENT).defaultView;
  private frame = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const view = this.view;
      const figure = parseFigure(this.element.textContent);

      if (!view || !figure || !('IntersectionObserver' in view)) {
        return;
      }

      if (view.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      this.render(figure, 0);

      const observer = new view.IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) {
            return;
          }

          observer.disconnect();
          this.animate(view, figure);
        },
        { threshold: VISIBLE_RATIO },
      );

      observer.observe(this.element);

      destroyRef.onDestroy(() => {
        observer.disconnect();
        view.cancelAnimationFrame(this.frame);
      });
    });
  }

  private animate(view: Window, figure: Figure): void {
    const startedAt = view.performance.now();

    const step = (now: number): void => {
      const progress = Math.min((now - startedAt) / DURATION_MS, 1);
      this.render(figure, Math.round(figure.value * easeOut(progress)));

      if (progress < 1) {
        this.frame = view.requestAnimationFrame(step);
      }
    };

    this.frame = view.requestAnimationFrame(step);
  }

  private render({ prefix, suffix }: Figure, value: number): void {
    this.element.textContent = `${prefix}${value}${suffix}`;
  }
}
