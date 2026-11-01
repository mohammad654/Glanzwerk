import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { PASSWORD_RULES } from '../../password-rules';
import { IconComponent } from '../icon/icon.component';

/**
 * The password policy as a live checklist.
 *
 * It replaced a single red sentence listing every requirement, which stayed red and
 * stayed there while the user typed a password that already satisfied it: the only
 * way to find out whether a password was acceptable was to submit the form. Each
 * rule now answers for itself as the characters arrive, and the list stops looking
 * like an error the moment the last one is met.
 *
 * Shared because registering and resetting ask for the same thing, and a second copy
 * of the list is a second chance to disagree with the server.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-password-rules',
  imports: [IconComponent],
  templateUrl: './password-rules.component.html',
})
export class PasswordRulesComponent {
  readonly password = input('');

  readonly rules = computed(() => {
    const password = this.password();
    return PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.holds(password) }));
  });
}
