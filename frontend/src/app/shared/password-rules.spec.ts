import { FormControl } from '@angular/forms';

import {
  MAX_PASSWORD_LENGTH,
  NEW_PASSWORD_VALIDATORS,
  PASSWORD_RULES,
  unmetRules,
} from './password-rules';

const control = (value: string) => new FormControl(value, [...NEW_PASSWORD_VALIDATORS]);

const ids = (password: string) => unmetRules(password).map((rule) => rule.id);

describe('password rules', () => {
  it('names every rule a password breaks', () => {
    expect(ids('short')).toEqual(['length', 'upper', 'digit']);
    expect(ids('alllowercase1')).toEqual(['upper']);
    expect(ids('ALLUPPERCASE1')).toEqual(['lower']);
    expect(ids('NoDigitsHere')).toEqual(['digit']);
  });

  it('is satisfied by a password the server would also accept', () => {
    expect(unmetRules('Sicher123')).toEqual([]);
    expect(control('Sicher123').valid).toBe(true);
  });

  it('becomes valid the moment the last rule is met, with no submit in between', () => {
    const password = control('sicher12');
    expect(password.invalid).toBe(true);

    password.setValue('Sicher12');

    // This is the behaviour the live checklist depends on: the error clears as the
    // characters arrive, not when the form is sent.
    expect(password.valid).toBe(true);
  });

  it('leaves an empty box to `required` rather than listing four complaints', () => {
    const empty = control('');

    expect(empty.hasError('required')).toBe(true);
    expect(empty.hasError('password')).toBe(false);
  });

  it('refuses a password past the length BCrypt would silently truncate', () => {
    const tooLong = control(`Aa1${'x'.repeat(MAX_PASSWORD_LENGTH)}`);

    expect(tooLong.hasError('maxlength')).toBe(true);
  });

  it('does not treat an umlaut as the upper-case letter, because the server does not', () => {
    // The API's regex is a plain `[A-Z]`. A browser rule that accepted `Ä` here would
    // promise a password the API then rejects.
    expect(ids('Ärger123')).toEqual(['upper']);
  });

  it('matches the rule the server states, one rule per requirement', () => {
    expect(PASSWORD_RULES.map((rule) => rule.id)).toEqual(['length', 'upper', 'lower', 'digit']);
  });
});
