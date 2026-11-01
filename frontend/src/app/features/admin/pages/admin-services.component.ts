import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';

import { ADMIN_PAGES } from '../../../core/admin';
import { fieldError } from '../../../core/api/api-error';
import { isFieldInvalid } from '../../../shared/form-field';
import { valueOr } from '../../../core/api/resource';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ServiceAdminApi, ServiceDraft, ServiceOffering } from '../data/service';
import { AdminAlertComponent } from '../shared/admin-alert.component';
import { AdminDialogComponent } from '../shared/admin-dialog.component';
import { AdminEmptyComponent } from '../shared/admin-empty.component';
import { loadErrorMessage } from '../shared/admin-load-error';
import { createMutation } from '../shared/admin-mutation';
import { AdminPageHeaderComponent } from '../shared/admin-page-header.component';
import { AdminStatusComponent } from '../shared/admin-status.component';
import { AdminTablePanelComponent } from '../shared/admin-table-panel.component';
import { formatDuration } from '../shared/duration';
import { matchesQuery } from '../shared/search';

/** Which service the dialog is editing, or `'new'`, or nothing. */
type Editing = ServiceOffering | 'new' | null;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-services',
  imports: [
    AdminAlertComponent,
    AdminDialogComponent,
    AdminEmptyComponent,
    AdminPageHeaderComponent,
    AdminStatusComponent,
    AdminTablePanelComponent,
    IconComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './admin-services.component.html',
})
export class AdminServicesComponent {
  private readonly api = inject(ServiceAdminApi);
  private readonly formBuilder = inject(FormBuilder);

  readonly page = ADMIN_PAGES.services;
  readonly duration = formatDuration;

  readonly services = rxResource({
    stream: () => this.api.list(),
    defaultValue: [] as readonly ServiceOffering[],
  });
  readonly loadError = computed(() => loadErrorMessage(this.services.error()));

  readonly query = signal('');

  readonly all = computed(() => valueOr(this.services, []));

  /**
   * Filtered in the browser, unlike bookings and enquiries.
   *
   * The catalogue is a dozen rows and will never be a thousand — it is the list of
   * things the business does. Paging it on the server would be a round trip per
   * keystroke for a table that fits on one screen.
   */
  readonly rows = computed(() =>
    this.all().filter((service) =>
      matchesQuery(this.query(), service.nameDe, service.nameEn, service.serviceKey),
    ),
  );

  readonly editing = signal<Editing>(null);
  readonly save = createMutation();
  readonly toggle = createMutation();

  readonly form = this.formBuilder.nonNullable.group({
    serviceKey: ['', [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9]*$/)]],
    nameDe: ['', [Validators.required, Validators.maxLength(255)]],
    nameEn: ['', [Validators.required, Validators.maxLength(255)]],
    descriptionDe: ['', Validators.maxLength(5000)],
    descriptionEn: ['', Validators.maxLength(5000)],
    // The same bounds the server enforces, so the form rejects a typo before the
    // round trip rather than after it.
    durationMinutes: [120, [Validators.required, Validators.min(15), Validators.max(600)]],
  });

  readonly dialogTitle = computed(() =>
    this.editing() === 'new'
      ? $localize`:@@admin.services.new:New service`
      : $localize`:@@admin.services.edit:Edit service`,
  );

  readonly labels = {
    panel: $localize`:@@admin.services.panelTitle:The offering`,
    search: $localize`:@@admin.services.search:Name or key`,
    empty: $localize`:@@admin.services.empty:No service matches that search.`,
    active: $localize`:@@admin.serviceStatus.active:On offer`,
    inactive: $localize`:@@admin.serviceStatus.inactive:Withdrawn`,
  };

  openNew(): void {
    this.save.reset();
    this.form.reset({
      serviceKey: '',
      nameDe: '',
      nameEn: '',
      descriptionDe: '',
      descriptionEn: '',
      durationMinutes: 120,
    });
    this.editing.set('new');
  }

  openEdit(service: ServiceOffering): void {
    this.save.reset();
    this.form.reset({
      serviceKey: service.serviceKey,
      nameDe: service.nameDe,
      nameEn: service.nameEn,
      descriptionDe: service.descriptionDe ?? '',
      descriptionEn: service.descriptionEn ?? '',
      durationMinutes: service.durationMinutes,
    });
    this.editing.set(service);
  }

  close(): void {
    this.editing.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const target = this.editing();
    if (!target) {
      return;
    }

    const value = this.form.getRawValue();
    const draft: ServiceDraft = {
      ...value,
      // An empty textarea is no description, not an empty one.
      descriptionDe: value.descriptionDe.trim() || null,
      descriptionEn: value.descriptionEn.trim() || null,
    };

    const request = target === 'new' ? this.api.create(draft) : this.api.update(target.id, draft);

    this.save.run(request, () => {
      this.close();
      this.services.reload();
    });
  }

  setActive(service: ServiceOffering, active: boolean): void {
    // Reloading rather than patching the row in place: the server is the authority on
    // what the catalogue looks like, and a local edit is a second copy of that truth.
    this.toggle.run(this.api.setActive(service.id, active), () => this.services.reload());
  }

  error(field: string): string | undefined {
    return fieldError(this.save.failure(), field);
  }

  invalid(field: keyof typeof this.form.controls): boolean {
    return isFieldInvalid(this.form.controls[field], this.save.failure(), field);
  }
}
