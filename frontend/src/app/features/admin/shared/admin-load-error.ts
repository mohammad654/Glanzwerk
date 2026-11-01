import { toFailure } from '../../../core/api/api-error';

/**
 * What a page shows when its data could not be fetched.
 *
 * A resource reports failures as an `Error`, and an `HttpErrorResponse` is not one,
 * so Angular wraps it and keeps the original on `cause`. Unwrapping it is what lets
 * the server's own sentence reach the screen instead of a generic wrapper message —
 * and it is the same unwrapping every form error goes through.
 */
export const loadErrorMessage = (error: unknown): string | null => {
  if (!error) {
    return null;
  }

  const original = error instanceof Error && error.cause !== undefined ? error.cause : error;
  return toFailure(original).message;
};
