import { SERVICES, Service } from './service-catalog';

/**
 * What an appointment is, shared by the dashboard and by a client's own list.
 *
 * It lives in `core/` rather than in either feature because both read it, and the
 * customer-facing pages must not import from `features/admin/` — a public page that
 * depends on the dashboard is a public page that breaks when the dashboard changes.
 * The admin-only pieces (the search query, the edit payload, the HTTP client) stay in
 * `features/admin/data/appointment.ts`.
 *
 * An appointment is **free**: there is no price here, and none on a service either.
 * It is a visit to come and look at the job; what the work costs is agreed afterwards.
 */

/**
 * Where a job is in its life.
 *
 * The same five names the backend enum uses: a second vocabulary on this side would
 * need translating in both directions and would drift the first time one was renamed.
 * Only the backend decides which transitions are legal.
 */
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const APPOINTMENT_STATUS_LABELS: Readonly<Record<AppointmentStatus, string>> = {
  REQUESTED: $localize`:@@admin.bookingStatus.requested:Requested`,
  CONFIRMED: $localize`:@@admin.bookingStatus.confirmed:Confirmed`,
  IN_PROGRESS: $localize`:@@admin.bookingStatus.inProgress:In progress`,
  COMPLETED: $localize`:@@admin.bookingStatus.completed:Completed`,
  CANCELLED: $localize`:@@admin.bookingStatus.cancelled:Cancelled`,
};

/**
 * Which badge a status wears. The four tones are the modifiers both stylesheets
 * define — `.admin-status--*` in the dashboard and `.booking-status--*` on the public
 * pages — so one status cannot read as "done" in one place and "cancelled" in another.
 */
export type StatusTone = 'neutral' | 'info' | 'success' | 'danger';

export const APPOINTMENT_STATUS_TONES: Readonly<Record<AppointmentStatus, StatusTone>> = {
  REQUESTED: 'neutral',
  CONFIRMED: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export const APPOINTMENT_STATUSES = Object.keys(APPOINTMENT_STATUS_LABELS) as readonly AppointmentStatus[];

/**
 * What a status may become next.
 *
 * A copy of the server's workflow, so the action menu offers only the moves that will
 * be accepted. The server checks it again and is the authority — this is to stop the
 * dashboard showing a button that is guaranteed to fail.
 */
export const NEXT_STATUSES: Readonly<Record<AppointmentStatus, readonly AppointmentStatus[]>> = {
  REQUESTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Statuses a client may still call off themselves. */
export const CLIENT_CANCELLABLE: readonly AppointmentStatus[] = ['REQUESTED', 'CONFIRMED'];

export interface AppointmentClient {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
}

export interface AppointmentService {
  readonly id: number;
  readonly serviceKey: string;
  readonly name: string;
}

export interface AppointmentEmployee {
  readonly id: number;
  readonly name: string;
  readonly jobRole: string;
}

/**
 * One appointment, with its client, service and assigned employee already resolved.
 *
 * The join happens in the database, in one query with fetch joins. The admin area
 * used to join three in-memory arrays itself; moving it to the server is what removed
 * the "deleted record" placeholders the old table had to render.
 */
export interface Appointment {
  readonly id: number;
  /** `GW-00012`. Derived from the id, so both sides can quote the same number. */
  readonly reference: string;
  readonly client: AppointmentClient;
  readonly service: AppointmentService;
  /** Null until somebody is put on the job. */
  readonly employee: AppointmentEmployee | null;
  /** Local date and time, without a zone: an appointment is a wall-clock commitment. */
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMinutes: number;
  readonly status: AppointmentStatus;
  readonly street: string;
  readonly postalCode: string;
  readonly city: string;
  readonly notes: string | null;
  readonly createdAt: string;
}

const CATALOG_BY_KEY = new Map(SERVICES.map((service) => [service.key, service]));

/**
 * The marketing catalogue entry a stored `serviceKey` points at.
 *
 * One map, built once, shared by every page that shows a service name. The API sends
 * the service's own name; the website's `shortTitle` is the shorter, more familiar
 * wording, so it wins wherever the key is one the catalogue knows.
 */
export const catalogServiceFor = (serviceKey: string): Service | undefined =>
  CATALOG_BY_KEY.get(serviceKey);

/** The label to show for an appointment's service: the site's wording, else the API's. */
export const serviceLabelFor = (service: AppointmentService): string =>
  catalogServiceFor(service.serviceKey)?.shortTitle ?? service.name;
