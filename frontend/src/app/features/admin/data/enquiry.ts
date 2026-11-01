import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { api } from '../../../core/api/api';
import { StatusTone } from '../../../core/appointment';
import { Paged } from './paged';

/** How far the office has got with an enquiry. */
export type EnquiryStatus = 'NEW' | 'READ' | 'RESPONDED' | 'CLOSED';

export const ENQUIRY_STATUS_LABELS: Readonly<Record<EnquiryStatus, string>> = {
  NEW: $localize`:@@admin.enquiryStatus.new:New`,
  READ: $localize`:@@admin.enquiryStatus.read:Read`,
  RESPONDED: $localize`:@@admin.enquiryStatus.responded:Answered`,
  CLOSED: $localize`:@@admin.enquiryStatus.closed:Closed`,
};

export const ENQUIRY_STATUS_TONES: Readonly<Record<EnquiryStatus, StatusTone>> = {
  NEW: 'danger',
  READ: 'info',
  RESPONDED: 'success',
  CLOSED: 'neutral',
};

export const ENQUIRY_STATUSES = Object.keys(ENQUIRY_STATUS_LABELS) as readonly EnquiryStatus[];

/**
 * A message from the website's contact form.
 *
 * It is a record, not an email. The form writes this row first and only then tries to
 * notify anyone, so an SMTP failure costs a notification and never the lead.
 */
export interface Enquiry {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly serviceId: number | null;
  readonly serviceName: string | null;
  readonly message: string;
  readonly status: EnquiryStatus;
  /** The office's own note. Never shown to the person who wrote in. */
  readonly adminNotes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EnquiryEdit {
  readonly status: EnquiryStatus;
  readonly adminNotes: string | null;
}

@Injectable({ providedIn: 'root' })
export class EnquiryAdminApi {
  private readonly http = inject(HttpClient);

  search(options: { status?: EnquiryStatus; query?: string; page?: number; size?: number } = {}) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<Paged<Enquiry>>(api('admin/contact-requests'), { params });
  }

  update(id: number, edit: EnquiryEdit): Observable<Enquiry> {
    return this.http.put<Enquiry>(api(`admin/contact-requests/${id}`), edit);
  }
}
