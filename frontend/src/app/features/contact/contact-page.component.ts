import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiFailure, fieldError, toFailure } from '../../core/api/api-error';
import { valueOr } from '../../core/api/resource';
import { ADDRESS_LINE, COMPANY, PRIMARY_CITY } from '../../core/company';
import { isBrowser } from '../../core/platform';
import { isFieldInvalid } from '../../shared/form-field';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BookableService, PublicCatalogApi } from '../account/data/catalog';
import { ContactApi } from './contact-api';

/** Long enough to describe a job, short enough to reject a pasted essay. */
const MESSAGE_LIMITS = { min: 10, max: 2000 } as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contact-page',
  imports: [IconComponent, PageBannerComponent, ReactiveFormsModule],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent {
  readonly pageTitle = $localize`:@@page.contact.h1:Contact`;

  private readonly formBuilder = inject(FormBuilder);
  private readonly contactApi = inject(ContactApi);
  private readonly catalog = inject(PublicCatalogApi);
  private readonly browser = isBrowser();

  readonly company = COMPANY;
  readonly addressLine = ADDRESS_LINE;
  readonly messageLimits = MESSAGE_LIMITS;

  /**
   * The service picker's options, from the API rather than from the frontend
   * catalogue.
   *
   * The enquiry stores a real `service_id`, so the dropdown has to offer the ids the
   * database knows — the marketing catalogue has no ids. It is skipped during the
   * prerender, where there is no API: the page renders with "something else" and
   * fills the list in once it hydrates.
   */
  private readonly servicesResource = rxResource({
    params: () => (this.browser ? true : undefined),
    stream: () => this.catalog.services(),
    defaultValue: [] as readonly BookableService[],
  });

  /**
   * The options, empty while loading and empty if the request failed.
   *
   * Through `valueOr` rather than straight off the resource: a failed request must
   * leave the form usable — the page carries a phone number — not throw on render.
   */
  readonly serviceOptions = computed(() => valueOr(this.servicesResource, []));

  readonly channels = [
    {
      icon: 'bi-telephone',
      label: 'Call us',
      value: COMPANY.phone,
      href: `tel:${COMPANY.phoneHref}`,
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
      note: `Serving ${PRIMARY_CITY} and the surrounding area`,
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
    // The id of a service, or '' for a general enquiry. Not required: somebody who
    // cannot see which box their job fits into should still be able to ask.
    serviceId: [''],
    message: [
      '',
      [
        Validators.required,
        Validators.minLength(MESSAGE_LIMITS.min),
        Validators.maxLength(MESSAGE_LIMITS.max),
      ],
    ],
    consent: [false, Validators.requiredTrue],
    // The honeypot. Hidden from people, irresistible to a bot that fills every input
    // it finds; the server drops anything that arrives with it set.
    website: [''],
  });

  readonly submitted = signal(false);
  readonly pending = signal(false);
  readonly failure = signal<ApiFailure | null>(null);

  readonly errorMessage = computed(() => this.failure()?.message ?? null);

  onSubmit(): void {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.failure.set(null);

    const value = this.form.getRawValue();

    this.contactApi
      .submit({
        name: value.name,
        email: value.email,
        phone: value.phone,
        serviceId: value.serviceId ? Number(value.serviceId) : null,
        message: value.message,
        consent: value.consent,
        website: value.website,
      })
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.submitted.set(true);
          this.form.reset();
        },
        error: (error: unknown) => {
          this.pending.set(false);
          this.failure.set(toFailure(error));
        },
      });
  }

  serverError(field: string): string | undefined {
    return fieldError(this.failure(), field);
  }

  isInvalid(control: keyof typeof this.form.controls): boolean {
    return isFieldInvalid(this.form.controls[control], this.failure(), control);
  }
}
