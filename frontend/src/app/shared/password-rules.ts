import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/**
 * The password policy, in one place.
 *
 * `RegisterRequest` and `ResetPasswordRequest` on the server enforce exactly these
 * rules, so this file has to agree with them character for character — including the
 * plain `[A-Z]`, which does not match `Ä`. A browser-side rule the server does not
 * share would reject a password the API would have taken; the other way round is
 * worse, because the form would promise something the API then refuses.
 *
 * The rules are predicates rather than one regex so the form can show *which* of them
 * a password still breaks and tick them off as they are met. The validator is built
 * from the same list, so the checklist cannot say "all good" while the control stays
 * invalid.
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * BCrypt's own limit: anything past it is ignored when hashing, so accepting a longer
 * password would quietly weaken it.
 */
export const MAX_PASSWORD_LENGTH = 72;

export interface PasswordRule {
  readonly id: string;
  readonly label: string;
  readonly holds: (password: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'length',
    label: $localize`:@@password.rule.length:At least 8 characters`,
    holds: (password) => password.length >= MIN_PASSWORD_LENGTH,
  },
  {
    id: 'upper',
    label: $localize`:@@password.rule.upper:One upper-case letter`,
    holds: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lower',
    label: $localize`:@@password.rule.lower:One lower-case letter`,
    holds: (password) => /[a-z]/.test(password),
  },
  {
    id: 'digit',
    label: $localize`:@@password.rule.digit:One digit`,
    holds: (password) => /\d/.test(password),
  },
];

/** The rules a password still breaks. Empty means it is acceptable. */
export const unmetRules = (password: string): readonly PasswordRule[] =>
  PASSWORD_RULES.filter((rule) => !rule.holds(password));

/**
 * Invalid while any rule is unmet, and it names them: `{ password: ['upper'] }`. A
 * form that wants the list for display reads the value, not this — the error exists
 * to make the control invalid, and to be inspectable in a test.
 */
const rulesValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = typeof control.value === 'string' ? control.value : '';
  if (value === '') {
    // `required` owns the empty case; saying "needs a digit" about an untouched
    // empty box would be four complaints about nothing having been typed yet.
    return null;
  }

  const unmet = unmetRules(value);
  return unmet.length === 0 ? null : { password: unmet.map((rule) => rule.id) };
};

/** Everything a new-password control needs, so two forms cannot drift apart. */
export const NEW_PASSWORD_VALIDATORS: readonly ValidatorFn[] = [
  Validators.required,
  Validators.maxLength(MAX_PASSWORD_LENGTH),
  rulesValidator,
];
