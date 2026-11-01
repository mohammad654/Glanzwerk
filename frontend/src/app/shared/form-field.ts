import { AbstractControl } from '@angular/forms';

import { ApiFailure, fieldError } from '../core/api/api-error';

/**
 * Whether to mark a field wrong: the user has been in it and left it invalid, or the
 * server rejected it by name.
 *
 * Six forms carried their own copy of this rule and they had drifted. The contact
 * page's left the server clause out, so a field the API rejected kept its ordinary
 * styling and never got `aria-invalid` — the message came back, and the only thing
 * that showed it was the alert at the top of the form. One implementation, so a
 * seventh form cannot disagree either.
 *
 * It lives here rather than beside `fieldError` because the API layer has no business
 * knowing what a `FormControl` is.
 */
export const isFieldInvalid = (
  control: AbstractControl | null | undefined,
  failure: ApiFailure | null,
  field: string,
): boolean =>
  (control !== null && control !== undefined && control.invalid && control.touched) ||
  fieldError(failure, field) !== undefined;
