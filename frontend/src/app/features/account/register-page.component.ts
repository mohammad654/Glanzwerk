import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiFailure, fieldError, toFailure } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { LINKS } from '../../core/routes';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { PasswordRulesComponent } from '../../shared/components/password-rules/password-rules.component';
import { isFieldInvalid } from '../../shared/form-field';
import { NEW_PASSWORD_VALIDATORS } from '../../shared/password-rules';

/**
 * Public registration.
 *
 * It creates a client account and nothing else. There is no role selector here, and
 * the API has no role field to send one to: an employee or administrator account only
 * comes from the dashboard, which is itself admin-only. That is the guard — not the
 * absence of a dropdown on this page.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-register-page',
  imports: [
    IconComponent,
    PageBannerComponent,
    PasswordRulesComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pageTitle = $localize`:@@page.register.h1:Create An Account`;
  readonly loginLink = LINKS.login;
  readonly privacyLink = LINKS.privacy;

  /** The same rules the server enforces, so a typo is caught before the round trip. */
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.pattern(/^$|^[0-9+()\s-]{6,30}$/)],
    // One definition of the policy, shared with the reset form and matching the API's.
    password: ['', [...NEW_PASSWORD_VALIDATORS]],
    consent: [false, Validators.requiredTrue],
  });

  /** What has been typed so far, so the checklist can tick itself off live. */
  readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });

  readonly pending = signal(false);
  readonly failure = signal<ApiFailure | null>(null);

  /**
   * The alert above the form, for a failure that belongs to no single field. One the
   * API pinned to a field — a duplicate email — is shown under that field, so the
   * same sentence is never in two places at once.
   */
  readonly errorMessage = computed(() => {
    const failure = this.failure();
    if (!failure || Object.keys(failure.fieldErrors).length > 0) {
      return null;
    }
    return failure.message;
  });

  /**
   * The address already has an account, so signing in is what they want. Pinned to
   * the 409, because a 400 about the email field means it was malformed, not taken.
   */
  readonly emailTaken = computed(
    () => this.failure()?.status === 409 && fieldError(this.failure(), 'email') !== undefined,
  );

  constructor() {
    // A server error is about the values that were sent; editing one makes it stale.
    // Without this, "that email address is already registered" stayed under a box
    // the user had since corrected, and only another submit could clear it.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.failure() !== null) {
        this.failure.set(null);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.failure.set(null);

    const { name, email, phone, password } = this.form.getRawValue();

    this.auth.register({ name, email, phone, password }).subscribe({
      next: () => {
        // Registering does not sign you in — one code path mints tokens — so the
        // new account is used straight away to do exactly that.
        this.auth.login({ email, password }).subscribe({
          next: () => {
            this.pending.set(false);
            void this.router.navigateByUrl(LINKS.account);
          },
          error: () => {
            // The account exists; only the automatic sign-in failed. Send them to the
            // form rather than leaving them on a page that looks like it did nothing.
            this.pending.set(false);
            void this.router.navigateByUrl(LINKS.login);
          },
        });
      },
      error: (error: unknown) => {
        this.pending.set(false);
        this.failure.set(toFailure(error));
      },
    });
  }

  /** The server's message for a field, which is more specific than ours. */
  serverError(field: string): string | undefined {
    return fieldError(this.failure(), field);
  }

  isInvalid(control: keyof typeof this.form.controls): boolean {
    return isFieldInvalid(this.form.controls[control], this.failure(), control);
  }
}
