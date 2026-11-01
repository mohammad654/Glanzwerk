import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DayAvailability } from '../../../core/api/availability';
import { SlotPickerComponent } from './slot-picker.component';

/** A host, so the inputs can change the way they do on the real forms. */
@Component({
  imports: [SlotPickerComponent],
  template: `
    <app-slot-picker
      [serviceId]="serviceId()"
      [employeeId]="employeeId()"
      (selected)="chosen = $event"
    />
  `,
})
class HostComponent {
  readonly serviceId = signal<number | null>(7);
  readonly employeeId = signal<number | null>(null);
  chosen: string | null = null;
}

/** Friday has two gaps; Saturday is wide open. No Sunday — the server omits it. */
const AVAILABILITY: DayAvailability[] = [
  { date: '2026-11-06', times: ['07:00', '08:00', '11:00'] },
  { date: '2026-11-07', times: ['07:00', '08:00', '09:00'] },
];

describe('SlotPickerComponent', () => {
  let http: HttpTestingController;

  const createHost = async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  };

  const flushAvailability = async (
    fixture: Awaited<ReturnType<typeof createHost>>,
    days = AVAILABILITY,
  ) => {
    const request = http.expectOne((r) => r.url === '/api/v1/availability');
    request.flush(days);
    await fixture.whenStable();
    fixture.detectChanges();
    return request;
  };

  const el = (fixture: Awaited<ReturnType<typeof createHost>>) =>
    fixture.nativeElement as HTMLElement;

  const dateOptions = (fixture: Awaited<ReturnType<typeof createHost>>) =>
    Array.from(el(fixture).querySelectorAll('select option')).map(
      (option) => (option as HTMLOptionElement).value,
    );

  const timeButtons = (fixture: Awaited<ReturnType<typeof createHost>>) =>
    Array.from(el(fixture).querySelectorAll('.slot-picker__slot')).map((b) =>
      (b.textContent ?? '').trim(),
    );

  it('asks for availability for the chosen service', async () => {
    const fixture = await createHost();
    const request = await flushAvailability(fixture);

    expect(request.request.params.get('serviceId')).toBe('7');
    expect(request.request.params.has('from')).toBe(true);
    expect(request.request.params.has('to')).toBe(true);
    // No employee asked for, so the parameter is left off entirely.
    expect(request.request.params.has('employeeId')).toBe(false);
    http.verify();
  });

  it('offers only the days the server returned, so a closed day cannot be picked', async () => {
    const fixture = await createHost();
    await flushAvailability(fixture);

    // The placeholder plus the two open days. 2026-11-08 is a Sunday and the server
    // never sent it, so it is simply absent rather than present and disabled.
    expect(dateOptions(fixture)).toEqual(['', '2026-11-06', '2026-11-07']);
    http.verify();
  });

  it('shows a day in full, minus the times already taken', async () => {
    const fixture = await createHost();
    await flushAvailability(fixture);

    const select = el(fixture).querySelector('select') as HTMLSelectElement;
    select.value = '2026-11-06';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    // 09:00 and 10:00 are missing because they are taken; the rest are offered.
    expect(timeButtons(fixture)).toEqual(['07:00', '08:00', '11:00']);
    http.verify();
  });

  it('emits the combined slot only once both halves are chosen', async () => {
    const fixture = await createHost();
    await flushAvailability(fixture);

    const select = el(fixture).querySelector('select') as HTMLSelectElement;
    select.value = '2026-11-07';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    // A day on its own is not a slot.
    expect(fixture.componentInstance.chosen).toBeNull();

    (el(fixture).querySelectorAll('.slot-picker__slot')[1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(fixture.componentInstance.chosen).toBe('2026-11-07T08:00');
    http.verify();
  });

  it('re-asks and clears the slot when the chosen colleague changes', async () => {
    const fixture = await createHost();
    await flushAvailability(fixture);

    const select = el(fixture).querySelector('select') as HTMLSelectElement;
    select.value = '2026-11-06';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    (el(fixture).querySelector('.slot-picker__slot') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.chosen).toBe('2026-11-06T07:00');

    // Asking for one person narrows the calendar, and 07:00 is no longer free on it.
    // `detectChanges`, not `whenStable`: the latter waits for the very request this
    // test has to answer, which would deadlock.
    fixture.componentInstance.employeeId.set(11);
    fixture.detectChanges();

    const second = http.expectOne((r) => r.url === '/api/v1/availability');
    expect(second.request.params.get('employeeId')).toBe('11');
    second.flush([{ date: '2026-11-06', times: ['11:00'] }]);
    await fixture.whenStable();
    fixture.detectChanges();

    // The stale 07:00 is dropped rather than submitted into a refusal.
    expect(fixture.componentInstance.chosen).toBeNull();
    expect(timeButtons(fixture)).toEqual(['11:00']);
    http.verify();
  });

  it('says so when there is nothing free, instead of showing an empty picker', async () => {
    const fixture = await createHost();
    await flushAvailability(fixture, []);

    expect(el(fixture).textContent).toContain('No free times');
    expect(el(fixture).querySelector('select')).toBeNull();
    http.verify();
  });

  it('asks for nothing until a service is chosen', async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.serviceId.set(null);
    fixture.detectChanges();
    await fixture.whenStable();

    // Nothing can be offered before a service is picked, so nothing is requested.
    http.verify();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Choose a service first');
  });
});
