import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { api } from '../../../core/api/api';
import { Appointment } from '../../../core/appointment';

/**
 * What a client may ask for.
 *
 * No price and no status: appointments are free, every one starts as `REQUESTED`, and
 * the end time is the start plus one slot, worked out on the server. No client id
 * either — it comes from the token, so there is no field here that could name
 * somebody else's account.
 */
export interface AppointmentRequest {
  readonly serviceId: number;
  /** Optional: ask for a particular person, or leave it to the office. */
  readonly employeeId: number | null;
  /** `YYYY-MM-DDTHH:mm`, local time, and one of the times availability offered. */
  readonly startTime: string;
  readonly street: string;
  readonly postalCode: string;
  readonly city: string;
  readonly notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class MyAppointmentsApi {
  private readonly http = inject(HttpClient);

  /**
   * The caller's own appointments.
   *
   * There is no `clientId` parameter by design: the endpoint reads the id from the
   * token, which is what makes it impossible to ask for anybody else's.
   */
  list(): Observable<readonly Appointment[]> {
    return this.http.get<Appointment[]>(api('appointments/mine'));
  }

  create(request: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(api('appointments'), request);
  }

  cancel(id: number): Observable<Appointment> {
    return this.http.post<Appointment>(api(`appointments/${id}/cancel`), null);
  }
}
