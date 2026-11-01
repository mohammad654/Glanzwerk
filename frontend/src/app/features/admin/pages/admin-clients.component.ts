import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ADMIN_PAGES } from '../../../core/admin';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
  AppointmentService,
  serviceLabelFor,
} from '../../../core/appointment';
import { Client, ClientAdminApi } from '../data/client';
import { AdminAlertComponent } from '../shared/admin-alert.component';
import { AdminAvatarComponent } from '../shared/admin-avatar.component';
import { AdminDialogComponent } from '../shared/admin-dialog.component';
import { AdminEmptyComponent } from '../shared/admin-empty.component';
import { loadErrorMessage } from '../shared/admin-load-error';
import { createMutation } from '../shared/admin-mutation';
import { AdminPageHeaderComponent } from '../shared/admin-page-header.component';
import { AdminStatusComponent } from '../shared/admin-status.component';
import { AdminTablePanelComponent } from '../shared/admin-table-panel.component';
import { valueOr } from '../../../core/api/resource';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-clients',
  imports: [
    AdminAlertComponent,
    AdminAvatarComponent,
    AdminDialogComponent,
    AdminEmptyComponent,
    AdminPageHeaderComponent,
    AdminStatusComponent,
    AdminTablePanelComponent,
    DatePipe,
    IconComponent,
  ],
  templateUrl: './admin-clients.component.html',
})
export class AdminClientsComponent {
  private readonly api = inject(ClientAdminApi);

  readonly page = ADMIN_PAGES.clients;
  readonly statusLabels = APPOINTMENT_STATUS_LABELS;
  readonly statusTones = APPOINTMENT_STATUS_TONES;

  readonly query = signal('');

  /**
   * Searched on the server.
   *
   * The counts in each row are aggregates from the database, which is also why they
   * are not computed here: counting a client's appointments in the browser would mean
   * fetching every appointment to count them.
   */
  readonly clients = rxResource({
    params: () => this.query().trim(),
    stream: ({ params }) => this.api.list(params || undefined),
    defaultValue: [] as readonly Client[],
  });

  readonly loadError = computed(() => loadErrorMessage(this.clients.error()));
  readonly rows = computed(() => valueOr(this.clients, []));

  /** Which client's history is open. The bookings come with the detail call. */
  readonly openClientId = signal<number | null>(null);

  private readonly detailResource = rxResource({
    params: () => this.openClientId(),
    stream: ({ params }) => this.api.get(params!),
  });

  readonly detailLoading = this.detailResource.isLoading;
  readonly detail = computed(() => valueOr(this.detailResource, undefined));
  readonly detailError = computed(() => loadErrorMessage(this.detailResource.error()));

  readonly toggle = createMutation();

  readonly labels = {
    panel: $localize`:@@admin.clients.panelTitle:All clients`,
    search: $localize`:@@admin.clients.search2:Name or email`,
    empty: $localize`:@@admin.clients.empty:No client matches that search.`,
    active: $localize`:@@admin.clientStatus.active:Active`,
    former: $localize`:@@admin.clientStatus.former:Blocked`,
    never: $localize`:@@admin.clients.neverBooked:Never booked`,
    history: $localize`:@@admin.clients.history:Appointment history`,
    noAppointments: $localize`:@@admin.clients.noAppointments:This client has no appointments yet.`,
  };

  serviceLabel(service: AppointmentService): string {
    return serviceLabelFor(service);
  }

  open(client: Client): void {
    this.openClientId.set(client.id);
  }

  close(): void {
    this.openClientId.set(null);
  }

  setActive(client: Client, active: boolean): void {
    // Blocking an account, never a delete: their appointments are business records
    // and the database refuses to drop a client an appointment points at.
    this.toggle.run(this.api.setActive(client.id, active), () => this.clients.reload());
  }
}
