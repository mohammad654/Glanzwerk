import { Component, computed, input } from '@angular/core';

/** Written by scripts/generate-icon-sprite.mjs, served from public/. */
const SPRITE = 'assets/icons/sprite.svg';

/**
 * One icon from the sprite. The selector stays on `<i>` so the markup and every
 * stylesheet rule that sizes or colours an icon through its parent keep working:
 * the glyph is now an `<svg>` of `1em`, inheriting `currentColor`.
 */
@Component({
  selector: 'i[appIcon]',
  template: `
    <svg aria-hidden="true" focusable="false">
      <use [attr.href]="href()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      line-height: 1;
      vertical-align: -0.125em;
    }

    svg {
      display: block;
      width: 1em;
      height: 1em;
      fill: currentColor;
    }
  `,
})
export class IconComponent {
  /** A sprite symbol id, as the catalogs store it — for example `bi-snow`. */
  readonly appIcon = input.required<string>();

  readonly href = computed(() => `${SPRITE}#${this.appIcon()}`);
}
