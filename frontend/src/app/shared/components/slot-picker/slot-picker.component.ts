import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { AvailabilityApi, DayAvailability } from '../../../core/api/availability';
import { valueOr } from '../../../core/api/resource';

/**
 * Pick a day, then a time on it.
 *
 * The whole point is that **it only ever shows what can actually be chosen**. The
 * server returns days that have at least one free time, so a Sunday, a fully booked
 * Friday and a date in the past are simply not in the list — there is nothing to grey
 * out, because the picker never learns those dates exist. Choosing a day then shows
 * that day's whole row of times with the taken ones missing.
 *
 * It asks the same endpoint the server validates against, so it cannot offer a slot
 * that would then be refused.
 *
 * `variant` only swaps class names: the marketing pages and the dark dashboard style
 * these very differently, and duplicating the date logic to get two looks would be
 * two places for it to go wrong.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-slot-picker',
  imports: [DatePipe],
  templateUrl: './slot-picker.component.html',
})
export class SlotPickerComponent {
  private readonly availability = inject(AvailabilityApi);

  /** Null until a service is chosen; nothing can be offered before then. */
  readonly serviceId = input<number | null>(null);
  /** Narrows the calendar to one person, for a client who asked for somebody. */
  readonly employeeId = input<number | null>(null);
  readonly variant = input<'site' | 'admin'>('site');
  /** How many days ahead to offer. The server caps this. */
  readonly days = input(42);

  /** `YYYY-MM-DDTHH:mm`, or null while the choice is incomplete. */
  readonly selected = output<string | null>();

  readonly chosenDate = signal<string>('');
  readonly chosenTime = signal<string>('');

  private readonly range = computed(() => {
    // Built from today rather than from a stored "now" so a tab left open overnight
    // does not keep asking about yesterday.
    const today = new Date();
    const from = today.toISOString().slice(0, 10);
    const until = new Date(today.getTime() + this.days() * 86_400_000);
    return { from, to: until.toISOString().slice(0, 10) };
  });

  private readonly resource = rxResource({
    params: () => {
      const serviceId = this.serviceId();
      return serviceId ? { serviceId, ...this.range(), employeeId: this.employeeId() } : undefined;
    },
    stream: ({ params }) =>
      this.availability.forRange(params.serviceId, params.from, params.to, params.employeeId),
    defaultValue: [] as readonly DayAvailability[],
  });

  readonly loading = this.resource.isLoading;

  /** The days on offer. Empty while loading, and empty if nothing is available. */
  readonly openDays = computed(() => valueOr(this.resource, []));

  /** The times on the chosen day, or nothing if no day is chosen yet. */
  readonly timesForChosenDate = computed(
    () => this.openDays().find((day) => day.date === this.chosenDate())?.times ?? [],
  );

  readonly nothingAvailable = computed(() => !this.loading() && this.openDays().length === 0);

  constructor() {
    // Whenever the offer changes — a different service, a different colleague — a
    // previously chosen slot may no longer exist. Keeping it would submit a time the
    // server is about to refuse, so it is dropped rather than silently kept.
    effect(() => {
      // Not while a request is in flight: mid-fetch there is nothing to compare
      // against, and treating "not loaded yet" as "no longer offered" would wipe the
      // choice every time the options are re-asked.
      if (this.loading()) {
        return;
      }

      const days = this.openDays();
      const date = this.chosenDate();

      if (date && !days.some((day) => day.date === date)) {
        this.reset();
        return;
      }

      const time = this.chosenTime();
      if (time && !this.timesForChosenDate().includes(time)) {
        this.chosenTime.set('');
        this.selected.emit(null);
      }
    });
  }

  onDateChange(date: string): void {
    this.chosenDate.set(date);
    // A time from the previous day means nothing on this one.
    this.chosenTime.set('');
    this.selected.emit(null);
  }

  chooseTime(time: string): void {
    this.chosenTime.set(time);
    this.selected.emit(`${this.chosenDate()}T${time}`);
  }

  /** Puts the picker back to "nothing chosen", and tells the host. */
  reset(): void {
    this.chosenDate.set('');
    this.chosenTime.set('');
    this.selected.emit(null);
  }

  /** Pre-selects a slot, for an edit form opening on an existing appointment. */
  preselect(startTime: string): void {
    const [date, time] = startTime.split('T');
    this.chosenDate.set(date);
    this.chosenTime.set(time?.slice(0, 5) ?? '');
  }
}
