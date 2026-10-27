import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SERVICES } from '../../core/service-catalog';
import { ContactPageComponent } from './contact-page.component';

describe('ContactPageComponent', () => {
  const createComponent = async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ContactPageComponent);
    await fixture.whenStable();
    return fixture;
  };

  it('offers every catalogued service, plus an escape hatch', async () => {
    const fixture = await createComponent();
    const options = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '#contact-service option',
    );

    // Placeholder + catalogue + "Something else".
    expect(options.length).toBe(SERVICES.length + 2);
  });

  it('refuses an empty enquiry and shows why', async () => {
    const fixture = await createComponent();

    fixture.componentInstance.onSubmit();
    await fixture.whenStable();

    expect(fixture.componentInstance.submitted()).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.form-field__error').length,
    ).toBeGreaterThan(0);
  });

  it('requires consent before the enquiry is accepted', async () => {
    const fixture = await createComponent();
    const form = fixture.componentInstance.form;

    form.patchValue({
      name: 'Anna Beck',
      email: 'anna@example.com',
      phone: '+49 30 1234567',
      service: SERVICES[0].title,
      message: 'Three-bedroom apartment, weekly clean, starting next month.',
    });

    expect(form.valid).toBe(false);

    form.patchValue({ consent: true });
    expect(form.valid).toBe(true);

    fixture.componentInstance.onSubmit();
    expect(fixture.componentInstance.submitted()).toBe(true);
  });
});
