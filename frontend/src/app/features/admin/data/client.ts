import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { api } from '../../../core/api/api';
import { Appointment } from '../../../core/appointment';

/**
 * A client, with what their history adds up to.
 *
 * A client is a user with role CLIENT — there is no separate clients table. Where the
 * work happens lives on the appointment, not here, since the same client books for
 * different addresses.
 *
 * `completedAppointments` is a count, not a sum of money: appointments are free.
 */
export interface Client {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly active: boolean;
  readonly registeredAt: string;
  readonly appointmentCount: number;
  /** Null for a client who has never made one. */
  readonly lastAppointmentAt: string | null;
  readonly completedAppointments: number;
}

export interface ClientDetail {
  readonly client: Client;
  readonly appointments: readonly Appointment[];
}

@Injectable({ providedIn: 'root' })
export class ClientAdminApi {
  private readonly http = inject(HttpClient);

  /** Searching server-side, so one client out of thousands costs one row, not all of them. */
  list(query?: string): Observable<readonly Client[]> {
    const params = query ? new HttpParams().set('query', query) : undefined;
    return this.http.get<Client[]>(api('admin/clients'), { params });
  }

  get(id: number): Observable<ClientDetail> {
    return this.http.get<ClientDetail>(api(`admin/clients/${id}`));
  }

  setActive(id: number, active: boolean): Observable<void> {
    const action = active ? 'activate' : 'deactivate';
    return this.http.post<void>(api(`admin/clients/${id}/${action}`), null);
  }
}
