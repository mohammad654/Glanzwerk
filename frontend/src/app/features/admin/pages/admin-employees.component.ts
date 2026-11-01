import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ADMIN_PAGES } from '../../../core/admin';
import { fieldError } from '../../../core/api/api-error';
import { isFieldInvalid } from '../../../shared/form-field';
import { valueOr } from '../../../core/api/resource';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import {
  EMPLOYEE_STATUS_LABELS,
  Employee,
  EmployeeAdminApi,
  JOB_ROLES,
  JOB_ROLE_LABELS,
  JobRole,
  SchedulableStatus,
} from '../data/employee';
import { ServiceAdminApi, ServiceOffering } from '../data/service';
import { AdminAlertComponent } from '../shared/admin-alert.component';
import { AdminAvatarComponent } from '../shared/admin-avatar.component';
import { AdminDialogComponent } from '../shared/admin-dialog.component';
import { AdminEmptyComponent } from '../shared/admin-empty.component';
import { loadErrorMessage } from '../shared/admin-load-error';
import { createMutation } from '../shared/admin-mutation';
import { AdminPageHeaderComponent } from '../shared/admin-page-header.component';
import { AdminStatusComponent, StatusTone } from '../shared/admin-status.component';
import { AdminTablePanelComponent } from '../shared/admin-table-panel.component';
import { matchesQuery } from '../shared/search';
import { catalogServiceFor } from '../../../core/appointment';

/** How many qualifications fit in a cell before the rest become a "+2". */
const SKILLS_SHOWN = 2;

const STATUS_TONES: Readonly<Record<string, StatusTone>> = {
  ACTIVE: 'success',
  ON_LEAVE: 'info',
  INACTIVE: 'neutral',
};

type Editing = Employee | 'new' | null;

/** An employee with the parts the table shows already worked out. */
interface EmployeeRow {
  readonly employee: Employee;
  readonly jobRole: string;
  readonly status: string;
  readonly tone: StatusTone;
  /** Short titles from the website's own catalogue, so the wording matches the site. */
  readonly skills: readonly string[];
  readonly hiddenSkills: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-employees',
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
    ReactiveFormsModule,
  ],
  templateUrl: './admin-employees.component.html',
})
export class AdminEmployeesComponent {
  private readonly api = inject(EmployeeAdminApi);
  private readonly serviceApi = inject(ServiceAdminApi);
  private readonly formBuilder = inject(FormBuilder);

  readonly page = ADMIN_PAGES.employees;
  readonly jobRoles = JOB_ROLES;
  readonly jobRoleLabels = JOB_ROLE_LABELS;

  readonly employees = rxResource({
    stream: () => this.api.list(),
    defaultValue: [] as readonly Employee[],
  });

  /**
   * The catalogue, for the qualification checkboxes.
   *
   * Loaded once with the page rather than when the dialog opens: a form that pauses
   * on its own fields reads as broken, and the list is a dozen rows.
   */
  readonly services = rxResource({
    stream: () => this.serviceApi.list(),
    defaultValue: [] as readonly ServiceOffering[],
  });

  readonly loadError = computed(
    () => loadErrorMessage(this.employees.error()) ?? loadErrorMessage(this.services.error()),
  );

  readonly query = signal('');

  readonly all = computed(() => valueOr(this.employees, []));

  readonly rows = computed<EmployeeRow[]>(() =>
    this.all()
      .filter((employee) =>
        matchesQuery(
          this.query(),
          employee.name,
          JOB_ROLE_LABELS[employee.jobRole],
          // Email is optional now that it is a contact detail rather than a login.
          employee.email ?? undefined,
        ),
      )
      .map((employee) => {
        // The API sends the service's own name; the website's short title is the
        // shorter, more familiar wording, so it wins where the key is one we know.
        const skills = employee.skills.map(
          (skill) => catalogServiceFor(skill.serviceKey)?.shortTitle ?? skill.name,
        );

        return {
          employee,
          jobRole: JOB_ROLE_LABELS[employee.jobRole],
          status: EMPLOYEE_STATUS_LABELS[employee.status],
          tone: STATUS_TONES[employee.status] ?? 'neutral',
          skills: skills.slice(0, SKILLS_SHOWN),
          hiddenSkills: Math.max(0, skills.length - SKILLS_SHOWN),
        };
      }),
  );

  readonly editing = signal<Editing>(null);
  /** The employee a delete is being confirmed for, if any. */
  readonly deleting = signal<Employee | null>(null);
  readonly save = createMutation();
  readonly toggle = createMutation();
  readonly remove = createMutation();

  /** The checkbox list's state, kept beside the form rather than in it. */
  readonly selectedServices = signal<readonly number[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    // A contact address, not a login — an employee has no account — so it is optional
    // and editable, unlike the email on a user.
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.pattern(/^$|^[0-9+()\s-]{6,30}$/)],
    jobRole: ['CLEANER' as JobRole, Validators.required],
    status: ['ACTIVE' as SchedulableStatus, Validators.required],
    weeklyHours: [40, [Validators.required, Validators.min(1), Validators.max(60)]],
    hiredOn: ['', Validators.required],
  });

  readonly isNew = computed(() => this.editing() === 'new');

  readonly dialogTitle = computed(() =>
    this.isNew()
      ? $localize`:@@admin.employees.new:New employee`
      : $localize`:@@admin.employees.edit:Edit employee`,
  );

  readonly serviceOptions = computed(() =>
    valueOr(this.services, []).map((service) => ({
      id: service.id,
      label: catalogServiceFor(service.serviceKey)?.shortTitle ?? service.nameDe,
      active: service.active,
    })),
  );

  readonly labels = {
    panel: $localize`:@@admin.employees.panelTitle:The team`,
    deleteTitle: $localize`:@@admin.employees.deleteTitle:Delete employee`,
    search: $localize`:@@admin.employees.search2:Name or role`,
    empty: $localize`:@@admin.employees.empty:Nobody matches that search.`,
  };

  openNew(): void {
    this.save.reset();
    this.selectedServices.set([]);
    this.form.reset({
      name: '',
      email: '',
      phone: '',
      jobRole: 'CLEANER',
      status: 'ACTIVE',
      weeklyHours: 40,
      hiredOn: new Date().toISOString().slice(0, 10),
    });
    this.editing.set('new');
  }

  openEdit(employee: Employee): void {
    this.save.reset();
    this.selectedServices.set(employee.skills.map((skill) => skill.serviceId));
    this.form.reset({
      name: employee.name,
      email: employee.email ?? '',
      phone: employee.phone ?? '',
      jobRole: employee.jobRole,
      // INACTIVE is the account flag, which the activate action owns — the form only
      // ever chooses between the two schedulable states.
      status: employee.status === 'ON_LEAVE' ? 'ON_LEAVE' : 'ACTIVE',
      weeklyHours: employee.weeklyHours,
      hiredOn: employee.hiredOn,
    });
    this.editing.set(employee);
  }

  close(): void {
    this.editing.set(null);
  }

  toggleService(id: number, checked: boolean): void {
    this.selectedServices.update((ids) =>
      checked ? [...new Set([...ids, id])] : ids.filter((current) => current !== id),
    );
  }

  isSelected(id: number): boolean {
    return this.selectedServices().includes(id);
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
    const serviceIds = this.selectedServices();

    const request =
      target === 'new'
        ? this.api.create({
            name: value.name,
            email: value.email,
            phone: value.phone,
            jobRole: value.jobRole,
            weeklyHours: value.weeklyHours,
            hiredOn: value.hiredOn,
            serviceIds,
          })
        : this.api.update(target.id, {
            name: value.name,
            email: value.email,
            phone: value.phone,
            jobRole: value.jobRole,
            status: value.status,
            weeklyHours: value.weeklyHours,
            hiredOn: value.hiredOn,
            serviceIds,
          });

    this.save.run(request, () => {
      this.close();
      this.employees.reload();
    });
  }

  askDelete(employee: Employee): void {
    this.remove.reset();
    this.deleting.set(employee);
  }

  cancelDelete(): void {
    this.deleting.set(null);
  }

  /** The warning the confirmation shows, with the name in it so the wrong row is obvious. */
  deleteWarning(employee: Employee): string {
    return $localize`:@@admin.employees.deleteWarning:${employee.name}:name: will be removed for good. Anyone with appointments on record cannot be deleted — deactivate them instead.`;
  }

  confirmDelete(): void {
    const employee = this.deleting();
    if (!employee) {
      return;
    }

    this.remove.run(this.api.remove(employee.id), () => {
      this.deleting.set(null);
      this.employees.reload();
    });
  }

  setActive(employee: Employee, active: boolean): void {
    this.toggle.run(this.api.setActive(employee.id, active), () => this.employees.reload());
  }

  error(field: string): string | undefined {
    return fieldError(this.save.failure(), field);
  }

  invalid(field: keyof typeof this.form.controls): boolean {
    return isFieldInvalid(this.form.controls[field], this.save.failure(), field);
  }
}
