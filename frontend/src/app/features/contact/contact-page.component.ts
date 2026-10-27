import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ADDRESS_LINE, COMPANY } from '../../core/company';
import { SERVICES } from '../../core/service-catalog';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

/** Long enough to describe a job, short enough to reject a pasted essay. */
const MESSAGE_LIMITS = { min: 10, max: 2000 } as const;

@Component({
  selector: 'app-contact-page',
  imports: [IconComponent, PageBannerComponent, ReactiveFormsModule],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly company = COMPANY;
  readonly addressLine = ADDRESS_LINE;
  readonly services = SERVICES.map((service) => service.title);
  readonly messageLimits = MESSAGE_LIMITS;

  readonly channels = [
    {
      icon: 'bi-telephone',
      label: 'Call us',
      value: COMPANY.phone,
      href: `tel:${COMPANY.phone}`,
      note: 'Fastest route for urgent and same-day work',
    },
    {
      icon: 'bi-envelope',
      label: 'Email us',
      value: COMPANY.email,
      href: `mailto:${COMPANY.email}`,
      note: 'Send a floor plan or photos and we will price it',
    },
    {
      icon: 'bi-geo-alt',
      label: 'Our office',
      value: ADDRESS_LINE,
      href: null,
      note: `Serving ${COMPANY.areaServed} and the surrounding area`,
    },
    {
      icon: 'bi-clock',
      label: 'Office hours',
      value: COMPANY.openingHours,
      href: null,
      note: 'Emergency call-outs run outside these hours',
    },
  ];

  readonly nextSteps = [
    'We read your message and call you back the same working day.',
    'We agree the scope and, where it helps, book a free site visit.',
    'You get a fixed written price before anyone starts work.',
  ];

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    // Deliberately permissive: international formats vary and a rejected number costs a lead.
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+()\s-]{6,30}$/)]],
    service: ['', Validators.required],
    message: [
      '',
      [
        Validators.required,
        Validators.minLength(MESSAGE_LIMITS.min),
        Validators.maxLength(MESSAGE_LIMITS.max),
      ],
    ],
    consent: [false, Validators.requiredTrue],
  });

  readonly submitted = signal(false);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Nothing is sent yet — the enquiry endpoint arrives with the backend, and these
    // rules have to be repeated there: client-side validation is a courtesy, not a guard.
    this.submitted.set(true);
    this.form.reset();
  }

  isInvalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.invalid && field.touched;
  }
}
