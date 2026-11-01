import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { api } from './api';

/**
 * One day a client may choose, and the times still free on it.
 *
 * Only days with a free time ever come back, so a closed day, a fully booked day and
 * a day in the past are simply absent. The picker therefore has nothing to grey out:
 * it renders what it is given.
 */
export interface DayAvailability {
  /** `YYYY-MM-DD`. */
  readonly date: string;
  /** `HH:mm`, on the hour, in the order they run. */
  readonly times: readonly string[];
}

/**
 * Where both the booking form and the dashboard's reschedule dialog get their slots.
 *
 * In `core/` rather than in either feature because both ask the same question, and
 * the answer has to be identical: the server refuses a time it did not offer.
 */
@Injectable({ providedIn: 'root' })
export class AvailabilityApi {
  private readonly http = inject(HttpClient);

  /**
   * @param serviceId what the appointment is about — it decides who is qualified.
   * @param employeeId narrows it to one person's calendar, for a client who asked
   *   for somebody in particular. Omitted, a slot is free when anyone qualified is.
   */
  forRange(
    serviceId: number,
    from: string,
    to: string,
    employeeId?: number | null,
  ): Observable<readonly DayAvailability[]> {
    let params = new HttpParams().set('serviceId', serviceId).set('from', from).set('to', to);
    if (employeeId) {
      params = params.set('employeeId', employeeId);
    }

    return this.http.get<DayAvailability[]>(api('availability'), { params });
  }
}
