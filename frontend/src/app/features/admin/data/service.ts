import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { api } from '../../../core/api/api';

/**
 * A service as the dashboard edits it.
 *
 * This is not the marketing service page. Those live in `core/service-catalog.ts`
 * with their copy, images and SEO metadata, translated at build time and prerendered;
 * they cannot move into a database without giving up the prerendering the whole site
 * is built on. `serviceKey` is the join: it is the same key on both sides, which is
 * how a booking row can show the catalogue's own short title and link to its page.
 */
export interface ServiceOffering {
  readonly id: number;
  readonly serviceKey: string;
  readonly nameDe: string;
  readonly nameEn: string;
  readonly descriptionDe: string | null;
  readonly descriptionEn: string | null;
  /**
   * Roughly how long the work itself takes. Information for the office, not a
   * scheduling input: every appointment is one fixed slot regardless.
   */
  readonly durationMinutes: number;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** What the create and edit forms post. `active` is not here — it has its own call. */
export interface ServiceDraft {
  readonly serviceKey: string;
  readonly nameDe: string;
  readonly nameEn: string;
  readonly descriptionDe: string | null;
  readonly descriptionEn: string | null;
  readonly durationMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class ServiceAdminApi {
  private readonly http = inject(HttpClient);

  list(): Observable<readonly ServiceOffering[]> {
    return this.http.get<ServiceOffering[]>(api('admin/services'));
  }

  create(draft: ServiceDraft): Observable<ServiceOffering> {
    return this.http.post<ServiceOffering>(api('admin/services'), draft);
  }

  update(id: number, draft: ServiceDraft): Observable<ServiceOffering> {
    return this.http.put<ServiceOffering>(api(`admin/services/${id}`), draft);
  }

  /** Deactivating is how a service leaves the offering: a delete would orphan appointments. */
  setActive(id: number, active: boolean): Observable<ServiceOffering> {
    const action = active ? 'activate' : 'deactivate';
    return this.http.post<ServiceOffering>(api(`admin/services/${id}/${action}`), null);
  }
}
