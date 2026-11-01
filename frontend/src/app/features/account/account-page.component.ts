import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { ApiFailure, toFailure } from '../../core/api/api-error';
import { valueOr } from '../../core/api/resource';
import { AuthService } from '../../core/auth/auth.service';
import { LINKS } from '../../core/routes';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
  Appointment,
  CLIENT_CANCELLABLE,
  serviceLabelFor,
} from '../../core/appointment';
import { MyAppointmentsApi } from './data/my-appointments';

/** How long the booking confirmation stays on screen before it clears itself. */
const CONFIRMATION_MS = 3000;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-account-page',
  imports: [DatePipe, IconComponent, PageBannerComponent, RouterLink],
  templateUrl: './account-page.component.html',
})
export class AccountPageComponent {
  private readonly api = inject(MyAppointmentsApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pageTitle = $localize`:@@page.account.h1:My Appointments`;
  readonly appointmentLink = LINKS.booking;
  readonly registerLink = LINKS.register;

  readonly signedIn = this.auth.isSignedIn;
  readonly user = this.auth.user;

  /**
   * The reference of an appointment just requested, bound from `?booked=`.
   *
   * The booking form sends people here rather than confirming in place, so the
   * confirmation has to arrive with them. In the URL rather than in router state so
   * that a reload, or a link sent to oneself, still shows it.
   */
  readonly booked = input<string>();

  /**
   * Whether the confirmation is still showing.
   *
   * It is an acknowledgement, not a record — the appointment itself is in the list
   * below it — so it goes away on its own rather than sitting above the page for the
   * rest of the visit. The reference stays in the URL, so a reader who needs it again
   * has not lost it.
   */
  private readonly confirmationVisible = signal(false);

  readonly showBooked = computed(() => !!this.booked() && this.confirmationVisible());

  constructor() {
    effect((onCleanup) => {
      if (!this.booked()) {
        this.confirmationVisible.set(false);
        return;
      }

      this.confirmationVisible.set(true);
      const timer = setTimeout(() => this.confirmationVisible.set(false), CONFIRMATION_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  readonly statusLabels = APPOINTMENT_STATUS_LABELS;
  readonly statusTones = APPOINTMENT_STATUS_TONES;

  /**
   * The caller's own appointments.
   *
   * The endpoint takes no client id — it reads one from the token — which is what
   * makes "my appointments" impossible to point at somebody else's.
   *
   * `params` is what keeps it from asking before there is a session. This page is not
   * guarded — an anonymous visitor is shown a sign-in invitation rather than being
   * bounced — and it used to request the list regardless, which 401'd, which the auth
   * interceptor then spent a refresh on, which 401'd too. Two doomed requests and a
   * console error for every visitor who was not signed in. Returning `undefined` while
   * signed out skips the request, and the resource runs the moment `restore()` finds
   * a session.
   */
  private readonly appointmentsResource = rxResource({
    params: () => (this.signedIn() ? true : undefined),
    stream: () => this.api.list(),
    defaultValue: [] as readonly Appointment[],
  });

  readonly loading = this.appointmentsResource.isLoading;

  /** Empty rather than throwing when the request failed; the alert says what happened. */
  private readonly all = computed(() => valueOr(this.appointmentsResource, []));

  readonly cancelling = signal<number | null>(null);
  readonly failure = signal<ApiFailure | null>(null);

  readonly errorMessage = computed(() => this.failure()?.message ?? null);

  /** Soonest first for what is still ahead, and the past after it, newest first. */
  readonly upcoming = computed(() =>
    this.all()
      .filter((appointment) => CLIENT_CANCELLABLE.includes(appointment.status) || appointment.status === 'IN_PROGRESS')
      .slice()
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );

  readonly past = computed(() =>
    this.all()
      .filter((appointment) => appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED')
      .slice()
      .sort((a, b) => b.startTime.localeCompare(a.startTime)),
  );

  serviceLabel(appointment: Appointment): string {
    return serviceLabelFor(appointment.service);
  }

  canCancel(appointment: Appointment): boolean {
    return CLIENT_CANCELLABLE.includes(appointment.status);
  }

  cancel(appointment: Appointment): void {
    if (this.cancelling() !== null) {
      return;
    }

    this.cancelling.set(appointment.id);
    this.failure.set(null);

    this.api.cancel(appointment.id).subscribe({
      next: () => {
        this.cancelling.set(null);
        // Reload rather than patch the row: the server decides what a cancelled
        // appointment looks like, and a local edit would be a second copy of that.
        this.appointmentsResource.reload();
      },
      error: (error: unknown) => {
        this.cancelling.set(null);
        this.failure.set(toFailure(error));
      },
    });
  }

  signIn(): void {
    void this.router.navigate([LINKS.login], { queryParams: { returnUrl: this.router.url } });
  }
}
