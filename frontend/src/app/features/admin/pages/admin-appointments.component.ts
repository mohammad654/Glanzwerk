import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ADMIN_PAGES } from '../../../core/admin';
import { fieldError } from '../../../core/api/api-error';
import { isFieldInvalid } from '../../../shared/form-field';
import { valueOr } from '../../../core/api/resource';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
  Appointment,
  AppointmentStatus,
  NEXT_STATUSES,
  serviceLabelFor,
} from '../../../core/appointment';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SlotPickerComponent } from '../../../shared/components/slot-picker/slot-picker.component';
import { AppointmentAdminApi } from '../data/appointment';
import { Employee, EmployeeAdminApi } from '../data/employee';
import { emptyPage } from '../data/paged';
import { AdminAlertComponent } from '../shared/admin-alert.component';
import { AdminAvatarComponent } from '../shared/admin-avatar.component';
import { AdminDialogComponent } from '../shared/admin-dialog.component';
import { AdminEmptyComponent } from '../shared/admin-empty.component';
import { loadErrorMessage } from '../shared/admin-load-error';
import { createMutation } from '../shared/admin-mutation';
import { AdminPageHeaderComponent } from '../shared/admin-page-header.component';
import { AdminPagerComponent } from '../shared/admin-pager.component';
import { AdminTablePanelComponent } from '../shared/admin-table-panel.component';

/** The filter row offers every status plus a way back to everything. */
type StatusFilter = AppointmentStatus | 'all';

const PAGE_SIZE = 25;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-appointments',
  imports: [
    AdminAlertComponent,
    AdminAvatarComponent,
    AdminDialogComponent,
    AdminEmptyComponent,
    AdminPageHeaderComponent,
    AdminPagerComponent,
    AdminTablePanelComponent,
    DatePipe,
    IconComponent,
    ReactiveFormsModule,
    SlotPickerComponent,
  ],
  templateUrl: './admin-appointments.component.html',
})
export class AdminAppointmentsComponent {
  private readonly api = inject(AppointmentAdminApi);
  private readonly employeeApi = inject(EmployeeAdminApi);
  private readonly formBuilder = inject(FormBuilder);

  readonly page = ADMIN_PAGES.appointments;
  readonly statusLabels = APPOINTMENT_STATUS_LABELS;
  readonly statusTones = APPOINTMENT_STATUS_TONES;
  readonly statuses = APPOINTMENT_STATUSES;

  readonly status = signal<StatusFilter>('all');
  readonly query = signal('');
  readonly pageIndex = signal(0);

  /**
   * Filtering, searching and paging all happen on the server.
   *
   * `params` makes the resource re-fetch whenever a filter changes, which is the
   * whole reason to use one here: the alternative is a subscription plus a flag for
   * "is a newer request already in flight", which is how stale rows get rendered.
   */
  readonly appointments = rxResource({
    params: () => ({
      status: this.status() === 'all' ? undefined : (this.status() as AppointmentStatus),
      query: this.query().trim() || undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
    }),
    stream: ({ params }) => this.api.search(params),
    defaultValue: emptyPage<Appointment>(),
  });

  private readonly employeesResource = rxResource({
    stream: () => this.employeeApi.list(),
    defaultValue: [] as readonly Employee[],
  });

  readonly loadError = computed(() => loadErrorMessage(this.appointments.error()));

  readonly appointmentPage = computed(() => valueOr(this.appointments, emptyPage<Appointment>()));
  readonly rows = computed(() => this.appointmentPage().items);
  readonly total = computed(() => this.appointmentPage().totalItems);

  readonly editing = signal<Appointment | null>(null);
  /** The appointment a delete is being confirmed for, if any. */
  readonly deleting = signal<Appointment | null>(null);
  readonly save = createMutation();
  readonly transition = createMutation();
  readonly remove = createMutation();

  /** The chosen slot, `YYYY-MM-DDTHH:mm`, from the picker. */
  readonly chosenSlot = signal<string | null>(null);
  private readonly picker = viewChild(SlotPickerComponent);

  /** The employee the picker should narrow the calendar to, as a number or null. */
  readonly chosenEmployeeId = signal<number | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    street: ['', [Validators.required, Validators.maxLength(255)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
    notes: ['', Validators.maxLength(2000)],
  });

  /**
   * Who may be put on the appointment being edited.
   *
   * Narrowed to the people trained for its service, because the server rejects
   * anybody else — offering the whole team would be offering choices that fail.
   */
  readonly assignable = computed(() => {
    const appointment = this.editing();
    if (!appointment) {
      return [];
    }

    return valueOr(this.employeesResource, [])
      .filter(
        (employee) =>
          employee.status === 'ACTIVE' &&
          employee.skills.some((skill) => skill.serviceId === appointment.service.id),
      )
      .map((employee) => ({ id: employee.id, name: employee.name }));
  });

  readonly labels = {
    panel: $localize`:@@admin.appointments.panelTitle:Schedule`,
    search: $localize`:@@admin.appointments.search:Reference, client or service`,
    empty: $localize`:@@admin.appointments.empty:No appointment matches that filter.`,
    all: $localize`:@@admin.filter.all:All`,
    unassigned: $localize`:@@admin.appointments.unassigned:Unassigned`,
    edit: $localize`:@@admin.appointments.edit:Edit appointment`,
    deleteTitle: $localize`:@@admin.appointments.deleteTitle:Delete appointment`,
  };

  readonly filters = computed(() => [
    { key: 'all' as StatusFilter, label: this.labels.all },
    ...this.statuses.map((status) => ({
      key: status as StatusFilter,
      label: APPOINTMENT_STATUS_LABELS[status],
    })),
  ]);

  /** The website's own short title where we recognise the key, the API's name otherwise. */
  serviceLabel(appointment: Appointment): string {
    return serviceLabelFor(appointment.service);
  }

  /** What this appointment's status may become. Empty once it is finished or called off. */
  nextStatuses(appointment: Appointment): readonly AppointmentStatus[] {
    return NEXT_STATUSES[appointment.status];
  }

  setStatus(filter: StatusFilter): void {
    this.status.set(filter);
    // A filter change puts us on a different set of rows, so page 7 of the old one
    // is meaningless — and often past the end of the new one.
    this.pageIndex.set(0);
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.pageIndex.set(0);
  }

  goToPage(index: number): void {
    this.pageIndex.set(index);
  }

  openEdit(appointment: Appointment): void {
    this.save.reset();
    this.chosenEmployeeId.set(appointment.employee?.id ?? null);
    this.chosenSlot.set(appointment.startTime.slice(0, 16));
    this.form.reset({
      street: appointment.street,
      postalCode: appointment.postalCode,
      city: appointment.city,
      notes: appointment.notes ?? '',
    });
    this.editing.set(appointment);
    // The picker mounts with the dialog, so the current slot is shown as chosen once
    // it exists rather than leaving the form looking empty.
    queueMicrotask(() => this.picker()?.preselect(appointment.startTime));
  }

  onEmployeeChange(value: string): void {
    this.chosenEmployeeId.set(value ? Number(value) : null);
  }

  close(): void {
    this.editing.set(null);
    this.chosenSlot.set(null);
  }

  submit(): void {
    const appointment = this.editing();
    if (!appointment) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const slot = this.chosenSlot();
    if (!slot) {
      // The picker only offers free slots, so there is nothing useful to say beyond
      // asking for one; the server would refuse an empty time anyway.
      return;
    }

    const value = this.form.getRawValue();

    this.save.run(
      this.api.update(appointment.id, {
        // An empty selection clears the assignment, which is how a visit goes back
        // into the pool.
        employeeId: this.chosenEmployeeId(),
        startTime: slot,
        street: value.street,
        postalCode: value.postalCode,
        city: value.city,
        notes: value.notes.trim() || null,
      }),
      () => {
        this.close();
        this.appointments.reload();
      },
    );
  }

  askDelete(appointment: Appointment): void {
    this.remove.reset();
    this.deleting.set(appointment);
  }

  cancelDelete(): void {
    this.deleting.set(null);
  }

  /** Says which appointment, so a click on the wrong row is caught before it lands. */
  deleteWarning(appointment: Appointment): string {
    return $localize`:@@admin.appointments.deleteWarning:${appointment.reference}:reference: for ${appointment.client.name}:client: will be removed for good. To call off a visit that was really arranged, cancel it instead.`;
  }

  confirmDelete(): void {
    const appointment = this.deleting();
    if (!appointment) {
      return;
    }

    this.remove.run(this.api.remove(appointment.id), () => {
      this.deleting.set(null);
      this.appointments.reload();
    });
  }

  /**
   * Moves an appointment to the status just chosen in its row.
   *
   * On a refusal the control is put back to the status the appointment still has.
   * Without that the row would show the status the office asked for while the alert
   * above the table says it was not accepted — two answers to the same question.
   */
  changeStatus(appointment: Appointment, select: HTMLSelectElement): void {
    const status = select.value as AppointmentStatus;
    if (status === appointment.status) {
      return;
    }

    this.transition.run(
      this.api.changeStatus(appointment.id, status),
      () => this.appointments.reload(),
      () => (select.value = appointment.status),
    );
  }

  /** Names the appointment, so the control is not thirty identical "Status" pickers. */
  statusAriaLabel(appointment: Appointment): string {
    return $localize`:@@admin.appointments.statusFor:Status of ${appointment.reference}:reference:`;
  }

  error(field: string): string | undefined {
    return fieldError(this.save.failure(), field);
  }

  invalid(field: keyof typeof this.form.controls): boolean {
    return isFieldInvalid(this.form.controls[field], this.save.failure(), field);
  }
}
