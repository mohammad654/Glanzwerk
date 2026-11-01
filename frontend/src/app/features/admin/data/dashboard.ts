import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { api } from '../../../core/api/api';
import { AppointmentStats } from './appointment';

/** The overview page's figures, counted in the database. */
export interface Dashboard {
  readonly activeClients: number;
  readonly activeEmployees: number;
  readonly activeServices: number;
  readonly newEnquiries: number;
  readonly appointments: AppointmentStats;
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  /** One request for the whole page, so it cannot render half-filled. */
  load(): Observable<Dashboard> {
    return this.http.get<Dashboard>(api('admin/dashboard'));
  }
}
