import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ADMIN_PAGES, adminLink } from '../../../core/admin';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DashboardApi } from '../data/dashboard';
import { AdminAlertComponent } from '../shared/admin-alert.component';
import { loadErrorMessage } from '../shared/admin-load-error';
import { AdminPageHeaderComponent } from '../shared/admin-page-header.component';
import { valueOr } from '../../../core/api/resource';

/**
 * One tile. `link` makes the figure the way into the page behind it.
 *
 * Every figure is a count. There is no money tile: appointments are free, so the
 * useful number is how many visits have happened, not what they were worth.
 */
interface Metric {
  readonly label: string;
  readonly value: number | null;
  readonly icon: string;
  readonly link: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-overview',
  imports: [
    AdminAlertComponent,
    AdminPageHeaderComponent,
    DecimalPipe,
    IconComponent,
    RouterLink,
  ],
  template: `
    <app-admin-page-header [page]="page">
      <button
        type="button"
        class="admin-btn"
        [disabled]="dashboard.isLoading()"
        (click)="dashboard.reload()"
      >
        <i appIcon="bi-arrow-repeat"></i>
        <span i18n="@@admin.refresh">Refresh</span>
      </button>
    </app-admin-page-header>

    @if (dashboard.isLoading()) {
      <div class="admin-loading"></div>
    }

    @if (errorMessage()) {
      <app-admin-alert [message]="errorMessage()!" />
    }

    <div class="admin-grid">
      @for (metric of metrics(); track metric.label) {
        <a class="admin-metric" [routerLink]="metric.link">
          <span class="admin-metric__label">
            <i [appIcon]="metric.icon"></i>
            {{ metric.label }}
          </span>
          <span class="admin-metric__figure">
            <strong class="admin-metric__value">
              <!-- An em dash while it loads: a zero is a fact, and showing one we do
                   not have yet is worse than showing nothing. -->
              @if (metric.value === null) {
                —
              } @else {
                {{ metric.value | number }}
              }
            </strong>
          </span>
        </a>
      }
    </div>
  `,
})
export class AdminOverviewComponent {
  private readonly api = inject(DashboardApi);

  readonly page = ADMIN_PAGES.overview;

  /**
   * One request for the whole page. Seven separate counts would be seven round trips
   * and seven chances to show a dashboard that is half yesterday's.
   */
  readonly dashboard = rxResource({ stream: () => this.api.load() });

  readonly errorMessage = computed(() => loadErrorMessage(this.dashboard.error()));

  readonly metrics = computed<Metric[]>(() => {
    // `valueOr`, not `value()`: once the request has failed, reading the value throws
    // and would replace the error banner with a blank page.
    const data = valueOr(this.dashboard, undefined);
    const appointments = data?.appointments;

    return [
      {
        label: $localize`:@@admin.metric.today:Appointments today`,
        value: appointments?.today ?? null,
        icon: 'bi-calendar-day',
        link: adminLink('appointments'),
      },
      {
        label: $localize`:@@admin.metric.week:Next seven days`,
        value: appointments?.next7Days ?? null,
        icon: 'bi-calendar-week',
        link: adminLink('appointments'),
      },
      {
        label: $localize`:@@admin.metric.requested:Awaiting confirmation`,
        value: appointments?.requested ?? null,
        icon: 'bi-hourglass-split',
        link: adminLink('appointments'),
      },
      {
        label: $localize`:@@admin.metric.enquiries:Unanswered enquiries`,
        value: data?.newEnquiries ?? null,
        icon: 'bi-envelope-paper',
        link: adminLink('enquiries'),
      },
      {
        label: $localize`:@@admin.metric.clients:Active clients`,
        value: data?.activeClients ?? null,
        icon: 'bi-people',
        link: adminLink('clients'),
      },
      {
        label: $localize`:@@admin.metric.employees:Staff on the books`,
        value: data?.activeEmployees ?? null,
        icon: 'bi-person-badge',
        link: adminLink('employees'),
      },
      {
        label: $localize`:@@admin.metric.completed:Appointments completed`,
        value: appointments?.completed ?? null,
        icon: 'bi-check2-circle',
        link: adminLink('appointments'),
      },
    ];
  });
}
