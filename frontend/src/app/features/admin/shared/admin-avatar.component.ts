import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Initials in a circle.
 *
 * There are no staff or client photographs, and a broken image in every row of a
 * table is worse than no image at all — so this never loads one.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-avatar',
  template: `<span class="admin-avatar" aria-hidden="true">{{ initials() }}</span>`,
})
export class AdminAvatarComponent {
  readonly name = input.required<string>();

  readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join(''),
  );
}
