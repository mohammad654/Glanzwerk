import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ContactPageComponent } from './contact-page.component';

/** What `GET /api/v1/services` answers with. Two is enough to prove the mapping. */
const SERVICES = [
  {
    id: 7,
    serviceKey: 'office',
    name: 'Büroreinigung',
    description: null,
    price: 150,
    durationMinutes: 150,
  },
  {
    id: 9,
    serviceKey: 'winter',
    name: 'Winterdienst',
    description: null,
    price: 110,
    durationMinutes: 60,
  },
];

describe('ContactPageComponent', () => {
  let http: HttpTestingController;

  /**
   * Note the `detectChanges()` instead of `whenStable()` before the flush.
   * `whenStable()` waits for every pending request to settle, and the request it
   * would be waiting for is the one this test has to answer — so awaiting it first
   * deadlocks. Render, answer, then wait.
   */
  const createComponent = async (withServices = true) => {
    await TestBed.configureTestingModule({
      imports: [ContactPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    const fixture = TestBed.createComponent(ContactPageComponent);
    fixture.detectChanges();

    if (withServices) {
      http.expectOne('/api/v1/services').flush(SERVICES);
      await fixture.whenStable();
    }

    return fixture;
  };

  const fillValidEnquiry = (fixture: Awaited<ReturnType<typeof createComponent>>) =>
    fixture.componentInstance.form.patchValue({
      name: 'Anna Beck',
      email: 'anna@example.com',
      phone: '+49 30 1234567',
      serviceId: '7',
      message: 'Three-bedroom apartment, weekly clean, starting next month.',
      consent: true,
    });

  it('fills the service picker from the API, so the enquiry carries a real service id', async () => {
    const fixture = await createComponent();
    const options = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '#contact-service option',
    );

    // "Something else" plus one per service the API returned.
    expect(options.length).toBe(SERVICES.length + 1);
    expect(Array.from(options).map((option) => (option as HTMLOptionElement).value)).toEqual([
      '',
      '7',
      '9',
    ]);
  });

  it('refuses an empty enquiry and shows why', async () => {
    const fixture = await createComponent();

    fixture.componentInstance.onSubmit();
    await fixture.whenStable();

    // Nothing was sent, which is the point.
    http.verify();

    expect(fixture.componentInstance.submitted()).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.form-field__error').length,
    ).toBeGreaterThan(0);
  });

  it('requires consent before the enquiry is accepted', async () => {
    const fixture = await createComponent();
    const form = fixture.componentInstance.form;

    fillValidEnquiry(fixture);
    expect(form.valid).toBe(true);

    form.patchValue({ consent: false });
    expect(form.valid).toBe(false);

    fixture.componentInstance.onSubmit();
    expect(fixture.componentInstance.submitted()).toBe(false);
    // An invalid form sends nothing at all.
    http.verify();
  });

  it('posts the enquiry and only then reports it sent', async () => {
    const fixture = await createComponent();
    fillValidEnquiry(fixture);

    fixture.componentInstance.onSubmit();

    const request = http.expectOne('/api/v1/contact-requests');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.serviceId).toBe(7);
    // The honeypot goes out empty; a filled one is how the server spots a bot.
    expect(request.request.body.website).toBe('');

    // Still not "sent" until the server says so.
    expect(fixture.componentInstance.submitted()).toBe(false);

    request.flush(null, { status: 202, statusText: 'Accepted' });
    await fixture.whenStable();

    expect(fixture.componentInstance.submitted()).toBe(true);
    expect(fixture.componentInstance.errorMessage()).toBeNull();
    http.verify();
  });

  it("shows the server's own message when the enquiry is refused", async () => {
    const fixture = await createComponent();
    fillValidEnquiry(fixture);

    fixture.componentInstance.onSubmit();

    http
      .expectOne('/api/v1/contact-requests')
      .flush(
        { status: 429, message: 'Too many messages sent. Please try again later.', path: '/x' },
        { status: 429, statusText: 'Too Many Requests' },
      );
    await fixture.whenStable();

    expect(fixture.componentInstance.submitted()).toBe(false);
    expect(fixture.componentInstance.errorMessage()).toBe(
      'Too many messages sent. Please try again later.',
    );
  });

  it('survives an API that is not there, so the form still works', async () => {
    const fixture = await createComponent(false);

    http.expectOne('/api/v1/services').error(new ProgressEvent('error'), { status: 0 });
    await fixture.whenStable();
    fixture.detectChanges();

    // The picker falls back to "something else" alone rather than breaking the page.
    const options = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '#contact-service option',
    );
    expect(options.length).toBe(1);
  });
});
