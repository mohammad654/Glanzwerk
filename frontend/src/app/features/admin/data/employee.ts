import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { api } from '../../../core/api/api';

/** What someone does here — not what they are allowed to do, which is their role. */
export type JobRole = 'CLEANER' | 'SUPERVISOR' | 'DRIVER' | 'OFFICE';

export const JOB_ROLE_LABELS: Readonly<Record<JobRole, string>> = {
  CLEANER: $localize`:@@admin.role.cleaner:Cleaner`,
  SUPERVISOR: $localize`:@@admin.role.supervisor:Site supervisor`,
  DRIVER: $localize`:@@admin.role.driver:Driver`,
  OFFICE: $localize`:@@admin.role.office:Office`,
};

export const JOB_ROLES = Object.keys(JOB_ROLE_LABELS) as readonly JobRole[];

/**
 * What the dashboard displays. `INACTIVE` is read-only: it means the record has been
 * deactivated, which the activate/deactivate action owns, not the edit form.
 */
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';

/** The two the edit form may choose between. */
export type SchedulableStatus = 'ACTIVE' | 'ON_LEAVE';

export const EMPLOYEE_STATUS_LABELS: Readonly<Record<EmployeeStatus, string>> = {
  ACTIVE: $localize`:@@admin.employeeStatus.active:Active`,
  ON_LEAVE: $localize`:@@admin.employeeStatus.leave:On leave`,
  INACTIVE: $localize`:@@admin.employeeStatus.inactive:Inactive`,
};

/** One service this person is trained for. */
export interface EmployeeSkill {
  readonly serviceId: number;
  readonly serviceKey: string;
  readonly name: string;
}

export interface Employee {
  readonly id: number;
  readonly name: string;
  /** A contact address, not a login. May be absent. */
  readonly email: string | null;
  readonly phone: string | null;
  readonly jobRole: JobRole;
  readonly status: EmployeeStatus;
  /** Whether they are still on the books. `status` reads INACTIVE when this is false. */
  readonly active: boolean;
  readonly weeklyHours: number;
  /** ISO date. */
  readonly hiredOn: string;
  readonly skills: readonly EmployeeSkill[];
  readonly createdAt: string;
}

/**
 * Adding a member of staff.
 *
 * There is no password, because an employee has no account to sign in to, and no role
 * either — an employee is not a user, so there is nothing a request could ask to be.
 * Only an administrator can reach the endpoint behind this.
 */
export interface EmployeeDraft {
  readonly name: string;
  /** A contact address, not a login. Optional. */
  readonly email: string;
  readonly phone: string;
  readonly jobRole: JobRole;
  readonly weeklyHours: number;
  readonly hiredOn: string;
  readonly serviceIds: readonly number[];
}

/**
 * Editing one. Email is editable here, unlike on a user account: it is a contact
 * detail rather than a sign-in identity, so changing it proves nothing and breaks
 * nothing.
 */
export interface EmployeeEdit {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly jobRole: JobRole;
  readonly status: SchedulableStatus;
  readonly weeklyHours: number;
  readonly hiredOn: string;
  readonly serviceIds: readonly number[];
}

@Injectable({ providedIn: 'root' })
export class EmployeeAdminApi {
  private readonly http = inject(HttpClient);

  list(): Observable<readonly Employee[]> {
    return this.http.get<Employee[]>(api('admin/employees'));
  }

  create(draft: EmployeeDraft): Observable<Employee> {
    return this.http.post<Employee>(api('admin/employees'), draft);
  }

  update(id: number, edit: EmployeeEdit): Observable<Employee> {
    return this.http.put<Employee>(api(`admin/employees/${id}`), edit);
  }

  /**
   * Only works while nothing points at the record: the API answers 409 once the
   * person has appointments, because history outlives employment.
   */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(api(`admin/employees/${id}`));
  }

  setActive(id: number, active: boolean): Observable<Employee> {
    const action = active ? 'activate' : 'deactivate';
    return this.http.post<Employee>(api(`admin/employees/${id}/${action}`), null);
  }
}
