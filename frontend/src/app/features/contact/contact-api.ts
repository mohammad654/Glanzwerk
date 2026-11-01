import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { api } from '../../core/api/api';

/** The contact form's payload. Mirrors `SubmitContactRequest` on the server. */
export interface ContactSubmission {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  /** A service id from the public catalogue, or null for a general enquiry. */
  readonly serviceId: number | null;
  readonly message: string;
  readonly consent: boolean;
  /** The honeypot, always empty when a person filled the form in. */
  readonly website: string;
}

@Injectable({ providedIn: 'root' })
export class ContactApi {
  private readonly http = inject(HttpClient);

  /**
   * Sends the enquiry.
   *
   * The server stores it before it tries to notify anyone, so a 202 means the message
   * is safe even if no email ever goes out. It answers 202 rather than 201 and gives
   * back nothing: there is no URL for the sender to read their enquiry back from.
   */
  submit(submission: ContactSubmission): Observable<void> {
    return this.http.post<void>(api('contact-requests'), submission);
  }
}
