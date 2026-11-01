import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ADMIN_PAGES } from '../../../core/admin';
import { fieldError } from '../../../core/api/api-error';
import { valueOr } from '../../../core/api/resource';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_STATUS_TONES,
  Enquiry,
  EnquiryAdminApi,
  EnquiryStatus,
} from '../data/enquiry';
import { emptyPage } from '../data/paged';
import { AdminAlertComponent } from '../shared/admin-alert.component';
import { AdminDialogComponent } from '../shared/admin-dialog.component';
import { AdminEmptyComponent } from '../shared/admin-empty.component';
import { loadErrorMessage } from '../shared/admin-load-error';
import { createMutation } from '../shared/admin-mutation';
import { AdminPageHeaderComponent } from '../shared/admin-page-header.component';
import { AdminPagerComponent } from '../shared/admin-pager.component';
import { AdminStatusComponent } from '../shared/admin-status.component';
import { AdminTablePanelComponent } from '../shared/admin-table-panel.component';

type StatusFilter = EnquiryStatus | 'all';

const PAGE_SIZE = 25;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-enquiries',
  imports: [
    AdminAlertComponent,
    AdminDialogComponent,
    AdminEmptyComponent,
    AdminPageHeaderComponent,
    AdminPagerComponent,
    AdminStatusComponent,
    AdminTablePanelComponent,
    DatePipe,
    IconComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './admin-enquiries.component.html',
})
export class AdminEnquiriesComponent {
  private readonly api = inject(EnquiryAdminApi);
  private readonly formBuilder = inject(FormBuilder);

  readonly page = ADMIN_PAGES.enquiries;
  readonly statusLabels = ENQUIRY_STATUS_LABELS;
  readonly statusTones = ENQUIRY_STATUS_TONES;
  readonly statuses = ENQUIRY_STATUSES;

  readonly status = signal<StatusFilter>('all');
  readonly query = signal('');
  readonly pageIndex = signal(0);

  readonly enquiries = rxResource({
    params: () => ({
      status: this.status() === 'all' ? undefined : (this.status() as EnquiryStatus),
      query: this.query().trim() || undefined,
      page: this.pageIndex(),
      size: PAGE_SIZE,
    }),
    stream: ({ params }) => this.api.search(params),
    defaultValue: emptyPage<Enquiry>(),
  });

  readonly loadError = computed(() => loadErrorMessage(this.enquiries.error()));
  readonly enquiryPage = computed(() => valueOr(this.enquiries, emptyPage<Enquiry>()));
  readonly rows = computed(() => this.enquiryPage().items);
  readonly total = computed(() => this.enquiryPage().totalItems);

  readonly open = signal<Enquiry | null>(null);
  readonly save = createMutation();

  readonly form = this.formBuilder.nonNullable.group({
    status: ['NEW' as EnquiryStatus, Validators.required],
    adminNotes: ['', Validators.maxLength(2000)],
  });

  readonly filters = computed(() => [
    { key: 'all' as StatusFilter, label: $localize`:@@admin.filter.all:All` },
    ...this.statuses.map((status) => ({
      key: status as StatusFilter,
      label: ENQUIRY_STATUS_LABELS[status],
    })),
  ]);

  readonly labels = {
    panel: $localize`:@@admin.enquiries.panelTitle:Messages`,
    search: $localize`:@@admin.enquiries.search:Name, email or text`,
    empty: $localize`:@@admin.enquiries.empty:No message matches that filter.`,
    dialog: $localize`:@@admin.enquiries.dialog:Enquiry`,
    general: $localize`:@@admin.enquiries.general:General enquiry`,
  };

  setStatus(filter: StatusFilter): void {
    this.status.set(filter);
    this.pageIndex.set(0);
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.pageIndex.set(0);
  }

  goToPage(index: number): void {
    this.pageIndex.set(index);
  }

  /**
   * Opening an unread message marks it read on save, not on open.
   *
   * Reading is deliberate here: a mis-click should not quietly clear the "new" badge
   * that is the only signal somebody is waiting for an answer. The dialog pre-selects
   * READ, so the ordinary act of opening and saving does the right thing.
   */
  openEnquiry(enquiry: Enquiry): void {
    this.save.reset();
    this.form.reset({
      status: enquiry.status === 'NEW' ? 'READ' : enquiry.status,
      adminNotes: enquiry.adminNotes ?? '',
    });
    this.open.set(enquiry);
  }

  close(): void {
    this.open.set(null);
  }

  submit(): void {
    const enquiry = this.open();
    if (!enquiry || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.save.run(
      this.api.update(enquiry.id, {
        status: value.status,
        adminNotes: value.adminNotes.trim() || null,
      }),
      () => {
        this.close();
        this.enquiries.reload();
      },
    );
  }

  error(field: string): string | undefined {
    return fieldError(this.save.failure(), field);
  }
}
