import { signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';

import { ApiFailure, toFailure } from '../../../core/api/api-error';

/**
 * The three bits of state every write on these pages needs: is it in flight, did it
 * fail, and what should the screen say about it.
 *
 * Written once here because otherwise each page grows its own `saving` signal, its own
 * `error` signal and its own slightly different `catchError`. It is a plain factory
 * rather than an injectable: there is one of these per form, not one per application,
 * and nothing in it needs the injector.
 */
export interface Mutation {
  /** True while a request is in flight — bind it to the submit button's `disabled`. */
  readonly pending: () => boolean;
  /** The last failure, or null. Cleared when a new attempt starts. */
  readonly failure: () => ApiFailure | null;
  /** Runs the call, then `onSuccess` only if it succeeded. */
  run<T>(source: Observable<T>, onSuccess?: (value: T) => void): void;
  reset(): void;
}

export const createMutation = (): Mutation => {
  const pending = signal(false);
  const failure = signal<ApiFailure | null>(null);

  return {
    pending: pending.asReadonly(),
    failure: failure.asReadonly(),

    run<T>(source: Observable<T>, onSuccess?: (value: T) => void): void {
      if (pending()) {
        // A second click while the first is still going would send the request twice.
        return;
      }

      pending.set(true);
      failure.set(null);

      source.pipe(finalize(() => pending.set(false))).subscribe({
        next: (value) => onSuccess?.(value),
        error: (error: unknown) => failure.set(toFailure(error)),
      });
    },

    reset(): void {
      failure.set(null);
    },
  };
};
