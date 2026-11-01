import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { api } from '../../../core/api/api';

/**
 * A service you can ask about, in the caller's language.
 *
 * The locale comes from the request's `Accept-Language`, which the browser sends for
 * us, so the German build gets German names without asking. Only active services are
 * ever returned: a visitor cannot discover what we have stopped offering.
 */
export interface BookableService {
  readonly id: number;
  readonly serviceKey: string;
  readonly name: string;
  readonly description: string | null;
  /**
   * Roughly how long the work itself takes — not how long the appointment is. The
   * appointment is one fixed slot, because it is a visit to look at the job.
   */
  readonly durationMinutes: number;
}

/** Someone who could do the job: a name and a job role, and nothing else about them. */
export interface EmployeeOption {
  readonly id: number;
  readonly name: string;
  readonly jobRole: string;
}

@Injectable({ providedIn: 'root' })
export class PublicCatalogApi {
  private readonly http = inject(HttpClient);

  /** Public — the contact form's picker uses this too. */
  services(): Observable<readonly BookableService[]> {
    return this.http.get<BookableService[]>(api('services'));
  }

  /**
   * Who may be asked for, for one service. Needs a session: the staff list is not
   * something to hand to anonymous visitors.
   */
  assignable(serviceId: number): Observable<readonly EmployeeOption[]> {
    return this.http.get<EmployeeOption[]>(api('employees/assignable'), {
      params: new HttpParams().set('serviceId', serviceId),
    });
  }
}
