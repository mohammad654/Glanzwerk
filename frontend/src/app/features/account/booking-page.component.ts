import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiFailure, fieldError, toFailure } from '../../core/api/api-error';
import { valueOr } from '../../core/api/resource';
import { AuthService } from '../../core/auth/auth.service';
import { LINKS } from '../../core/routes';
import { isFieldInvalid } from '../../shared/form-field';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { SlotPickerComponent } from '../../shared/components/slot-picker/slot-picker.component';
import { BookableService, EmployeeOption, PublicCatalogApi } from './data/catalog';
import { MyAppointmentsApi } from './data/my-appointments';

/**
 * Requesting an appointment.
 *
 * It asks for a service, optionally a person, a day, a time and where the work is.
 * It never asks for a price, because an appointment is free: it is somebody coming
 * out to look at the job, and what the work costs is agreed afterwards.
 *
 * The day and time come from `app-slot-picker`, which offers only what is actually
 * free — a closed or fully booked day is not in the list at all — and asks the same
 * endpoint the server validates against, so the form cannot offer a slot that will
 * then be refused.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-booking-page',
  imports: [
    IconComponent,
    PageBannerComponent,
    ReactiveFormsModule,
    RouterLink,
    SlotPickerComponent,
  ],
  templateUrl: './booking-page.component.html',
})
export class BookingPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly catalog = inject(PublicCatalogApi);
  private readonly appointments = inject(MyAppointmentsApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pageTitle = $localize`:@@page.booking.h1:Book An Appointment`;
  readonly loginLink = LINKS.login;
  readonly registerLink = LINKS.register;
  readonly accountLink = LINKS.account;

  /** Whether to show the form at all, or an invitation to sign in. */
  readonly signedIn = this.auth.isSignedIn;

  readonly form = this.formBuilder.nonNullable.group({
    serviceId: ['', Validators.required],
    employeeId: [''],
    street: ['', [Validators.required, Validators.maxLength(255)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
    city: ['Dresden', [Validators.required, Validators.maxLength(120)]],
    notes: ['', Validators.maxLength(2000)],
  });

  private readonly servicesResource = rxResource({
    stream: () => this.catalog.services(),
    defaultValue: [] as readonly BookableService[],
  });

  readonly services = computed(() => valueOr(this.servicesResource, []));

  /** Which service is picked, as a signal so the staff list and slots follow it. */
  readonly selectedServiceId = signal<number | null>(null);
  readonly selectedEmployeeId = signal<number | null>(null);

  readonly selectedService = computed(() =>
    this.services().find((service) => service.id === this.selectedServiceId()),
  );

  /**
   * Who could come out for the picked service.
   *
   * Re-fetched when the service changes, because being trained for office cleaning
   * says nothing about winter service.
   */
  private readonly employeesResource = rxResource({
    params: () => this.selectedServiceId() ?? undefined,
    stream: ({ params }) => this.catalog.assignable(params),
    defaultValue: [] as readonly EmployeeOption[],
  });

  readonly employees = computed(() => valueOr(this.employeesResource, []));

  /** The chosen slot, `YYYY-MM-DDTHH:mm`, or null while it is incomplete. */
  readonly chosenSlot = signal<string | null>(null);

  readonly pending = signal(false);
  readonly failure = signal<ApiFailure | null>(null);

  readonly errorMessage = computed(() => this.failure()?.message ?? null);

  /**
   * Set the first time the button is pressed.
   *
   * The button used to be disabled until the form was complete, which answered a
   * click with nothing at all: no message, no highlight, no reason. It is enabled
   * now, and pressing it with something missing says what is missing — which is the
   * only version a visitor can act on. The server refuses an incomplete request
   * anyway, so nothing here is the real guard.
   */
  private readonly attempted = signal(false);


  constructor() {
    this.form.controls.serviceId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        // The select holds a string; everything downstream wants a number or nothing.
        this.selectedServiceId.set(value ? Number(value) : null);
        // A person chosen for the previous service is probably not trained for this
        // one, and the server would reject them — so the choice is cleared rather
        // than left to fail on submit. The picker clears its own slot in turn.
        this.form.controls.employeeId.setValue('');
      });

    this.form.controls.employeeId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.selectedEmployeeId.set(value ? Number(value) : null));
  }

  submit(): void {
    this.attempted.set(true);

    const slot = this.chosenSlot();
    if (this.form.invalid || !slot || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.failure.set(null);

    const value = this.form.getRawValue();

    this.appointments
      .create({
        serviceId: Number(value.serviceId),
        employeeId: value.employeeId ? Number(value.employeeId) : null,
        startTime: slot,
        street: value.street,
        postalCode: value.postalCode,
        city: value.city,
        notes: value.notes.trim() || null,
      })
      .subscribe({
        next: (appointment) => {
          this.pending.set(false);
          // The confirmation belongs where the appointment now is: the account page
          // shows it in the list, so a success notice here would say the same thing
          // next to a form that is no longer the point. The reference travels in the
          // URL so a reload still shows it, and so the page can be linked to.
          void this.router.navigate([this.accountLink], {
            queryParams: { booked: appointment.reference },
          });
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.failure.set(toFailure(error));
        },
      });
  }

  signIn(): void {
    void this.router.navigate([LINKS.login], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  serverError(field: string): string | undefined {
    return fieldError(this.failure(), field);
  }

  isInvalid(control: keyof typeof this.form.controls): boolean {
    return isFieldInvalid(this.form.controls[control], this.failure(), control);
  }

  /** A day and time were never picked, and the form has been sent for. */
  slotMissing(): boolean {
    return this.attempted() && this.chosenSlot() === null;
  }

  /**
   * Something is still missing, so the fields are marked and the button says why.
   *
   * A method rather than a `computed`: a form's validity is not a signal, so a
   * computed over it would keep answering with whatever was true when it first ran.
   */
  incomplete(): boolean {
    return this.attempted() && (this.form.invalid || this.chosenSlot() === null);
  }
}
