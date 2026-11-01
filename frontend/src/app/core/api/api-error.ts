import { HttpErrorResponse } from '@angular/common/http';

/**
 * The backend's error shape — `GlobalExceptionHandler` guarantees every failure
 * takes this form, and nothing else does.
 */
export interface ApiErrorBody {
  readonly timestamp: string;
  readonly status: number;
  readonly message: string;
  readonly path: string;
  /** Present only on a 400 from bean validation: field name to message. */
  readonly fieldErrors?: Readonly<Record<string, string>>;
}

/** Something went wrong and here is what to put on the screen. */
export interface ApiFailure {
  readonly status: number;
  readonly message: string;
  readonly fieldErrors: Readonly<Record<string, string>>;
}

const OFFLINE = $localize`:@@api.error.offline:Could not reach the server. Check your connection and try again.`;
const UNEXPECTED = $localize`:@@api.error.unexpected:Something went wrong. Please try again.`;
const FORBIDDEN = $localize`:@@api.error.forbidden:You do not have permission to do that.`;
const UNAUTHORIZED = $localize`:@@api.error.unauthorized:Your session has expired. Please sign in again.`;

/**
 * Turns any HTTP failure into one message and a field map.
 *
 * The server's own sentence is preferred when it sent one, because it is the only
 * party that knows *why* — "that employee already has a booking at that time" is
 * worth showing, where a generic "request failed" sends the user guessing. A status 0
 * is not a server error at all: the request never arrived, so it gets its own text.
 */
export const toFailure = (error: unknown): ApiFailure => {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: 0, message: UNEXPECTED, fieldErrors: {} };
  }

  if (error.status === 0) {
    return { status: 0, message: OFFLINE, fieldErrors: {} };
  }

  const body = error.error as ApiErrorBody | string | null;
  const fromBody = typeof body === 'object' && body !== null ? body.message : undefined;
  const fieldErrors = (typeof body === 'object' && body?.fieldErrors) || {};

  const fallback =
    error.status === 401 ? UNAUTHORIZED : error.status === 403 ? FORBIDDEN : UNEXPECTED;

  return { status: error.status, message: fromBody?.trim() || fallback, fieldErrors };
};

/** The first message for a field, for a form control's error text. */
export const fieldError = (failure: ApiFailure | null, field: string): string | undefined =>
  failure?.fieldErrors[field];
