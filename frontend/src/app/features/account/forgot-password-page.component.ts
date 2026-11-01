import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiFailure, fieldError, toFailure } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { LINKS } from '../../core/routes';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { isFieldInvalid } from '../../shared/form-field';

/**
 * Step one of a forgotten password: ask for a link.
 *
 * It asks for nothing but the address. The new password is chosen on the page the
 * link leads to, so this form cannot be used to set one — which is the point: anybody
 * can reach this page, and only the person reading that mailbox can finish.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-forgot-password-page',
  imports: [IconComponent, PageBannerComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
})
export class ForgotPasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly pageTitle = $localize`:@@page.forgotPassword.h1:Forgotten Password`;
  readonly loginLink = LINKS.login;
  readonly registerLink = LINKS.register;

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
  });

  readonly pending = signal(false);
  readonly failure = signal<ApiFailure | null>(null);

  /** The address a link went to, which is also what tells the template to say so. */
  readonly sentTo = signal<string | null>(null);

  readonly errorMessage = computed(() => {
    const failure = this.failure();
    if (!failure || Object.keys(failure.fieldErrors).length > 0) {
      return null;
    }
    return failure.message;
  });

  /** No account has that address, so there is nothing to reset — register instead. */
  readonly unknownEmail = computed(
    () => this.failure()?.status === 401 && fieldError(this.failure(), 'email') !== undefined,
  );

  constructor() {
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
    this.sentTo.set(null);

    const email = this.form.getRawValue().email.trim();

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.pending.set(false);
        this.sentTo.set(email);
      },
      error: (error: unknown) => {
        this.pending.set(false);
        this.failure.set(toFailure(error));
      },
    });
  }

  serverError(control: keyof typeof this.form.controls): string | undefined {
    return fieldError(this.failure(), control);
  }

  isInvalid(control: keyof typeof this.form.controls): boolean {
    return isFieldInvalid(this.form.controls[control], this.failure(), control);
  }
}
