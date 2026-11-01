import { Resource } from '@angular/core';

/**
 * A resource's value, or a fallback when there isn't one yet.
 *
 * `resource.value()` throws a `ResourceValueError` in the **error** state, and it does
 * that even when the resource was created with a `defaultValue`, which only covers
 * loading and idle. A template that reads `value()` directly therefore takes the whole
 * page down the moment a request fails — precisely when the page most needs to keep
 * working: the contact page carries a phone number, and the dashboard needs to render
 * its "could not load" banner. So every read of a resource goes through here.
 *
 * Only the error state falls back. While a resource is *reloading* it still holds the
 * previous value, and handing that back is what keeps a table's rows on screen during
 * a refresh instead of flashing empty — and what stops a half-finished form choice
 * being thrown away the moment its options are re-fetched.
 *
 * `?? fallback` covers the loading state of a resource declared without a
 * `defaultValue`, where the value really is `undefined`.
 */
export const valueOr = <T>(resource: Resource<T>, fallback: T): T => {
  if (resource.status() === 'error') {
    return fallback;
  }
  return resource.value() ?? fallback;
};
