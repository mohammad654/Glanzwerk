import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { api } from '../../../core/api/api';
import { Appointment, AppointmentStatus } from '../../../core/appointment';
import { Paged } from './paged';

/** The dashboard's filter row. Every field is optional. */
export interface AppointmentQuery {
  readonly status?: AppointmentStatus;
  readonly employeeId?: number;
  readonly clientId?: number;
  readonly from?: string;
  readonly to?: string;
  readonly query?: string;
  readonly page?: number;
  readonly size?: number;
}

/**
 * What the office may change: who is going, when, and where.
 *
 * No price — appointments are free. No length either: it is always one slot, worked
 * out on the server. The status moves through its own call.
 */
export interface AppointmentEdit {
  readonly employeeId: number | null;
  /** `YYYY-MM-DDTHH:mm`, and the time must be one the slot grid offers. */
  readonly startTime: string;
  readonly street: string;
  readonly postalCode: string;
  readonly city: string;
  readonly notes: string | null;
}

export interface AppointmentStats {
  readonly requested: number;
  readonly confirmed: number;
  readonly today: number;
  readonly next7Days: number;
  /** A count of visits made, not a sum of money: appointments are free. */
  readonly completed: number;
}

@Injectable({ providedIn: 'root' })
export class AppointmentAdminApi {
  private readonly http = inject(HttpClient);

  /**
   * Filtering and paging happen on the server.
   *
   * The old demo table pulled everything and filtered in the browser, which is fine
   * for twelve rows and a download of the entire history for twelve thousand.
   */
  search(query: AppointmentQuery): Observable<Paged<Appointment>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<Paged<Appointment>>(api('admin/appointments'), { params });
  }

  stats(): Observable<AppointmentStats> {
    return this.http.get<AppointmentStats>(api('admin/appointments/stats'));
  }

  update(id: number, edit: AppointmentEdit): Observable<Appointment> {
    return this.http.put<Appointment>(api(`admin/appointments/${id}`), edit);
  }

  /**
   * A hard delete, for a row that should never have been in the diary. Calling off a
   * visit that was really arranged is a status change, not this.
   */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(api(`admin/appointments/${id}`));
  }

  changeStatus(id: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.post<Appointment>(api(`admin/appointments/${id}/status`), { status });
  }
}
