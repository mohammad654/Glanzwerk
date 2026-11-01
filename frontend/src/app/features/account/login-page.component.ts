import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiFailure, fieldError, toFailure } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { LINKS } from '../../core/routes';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { isFieldInvalid } from '../../shared/form-field';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-page',
  imports: [IconComponent, PageBannerComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly pageTitle = $localize`:@@page.login.h1:Sign In`;
  readonly registerLink = LINKS.register;
  readonly forgotPasswordLink = LINKS.forgotPassword;

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    // No length or complexity rules here: those belong on registration. Enforcing
    // them at sign-in would lock out anybody whose password predates the current
    // policy, and would tell an attacker what the policy is.
    password: ['', Validators.required],
  });

  readonly pending = signal(false);
  readonly failure = signal<ApiFailure | null>(null);

  /**
   * The alert above the form, for a failure that belongs to no single field — the
   * server being unreachable, or a rate limit. A failure the API pinned to a field
   * is shown under that field instead, so one message is never in two places.
   */
  readonly errorMessage = computed(() => {
    const failure = this.failure();
    if (!failure || Object.keys(failure.fieldErrors).length > 0) {
      return null;
    }
    return failure.message;
  });

  /**
   * The two answers a failed sign-in can now give, read from the *field* the API
   * named rather than from its prose.
   *
   * The API speaks English only and this site is German first, so echoing its
   * sentence would put an English line on a German page. The field name is a stable
   * contract — see `InvalidCredentialsException` on the server — and the wording
   * belongs here, where it can be translated. `serverError()` stays as the fallback
   * for anything these two do not cover.
   *
   * Both are pinned to the 401: a 400 naming the email field means it was malformed,
   * which is a different sentence and no invitation to register.
   */
  readonly unknownEmail = computed(
    () => this.failure()?.status === 401 && fieldError(this.failure(), 'email') !== undefined,
  );

  readonly wrongPassword = computed(
    () => this.failure()?.status === 401 && fieldError(this.failure(), 'password') !== undefined,
  );

  constructor() {
    // A server error describes the values that were sent. The moment one of them is
    // edited it no longer does, so it goes — otherwise "the password is incorrect"
    // sits under a password that has since been corrected, and the only way to clear
    // it is to submit again.
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

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (session) => {
        this.pending.set(false);
        // Where to go next is the role's decision, not the form's: staff land in the
        // dashboard, clients in their own appointments.
        const fallback = session.user.role === 'ADMIN' ? LINKS.admin : LINKS.account;
        void this.router.navigateByUrl(this.returnUrl() ?? fallback);
      },
      error: (error: unknown) => {
        this.pending.set(false);
        this.failure.set(toFailure(error));
      },
    });
  }

  /** The server's message for a field, which is more specific than ours. */
  serverError(control: keyof typeof this.form.controls): string | undefined {
    return fieldError(this.failure(), control);
  }

  isInvalid(control: keyof typeof this.form.controls): boolean {
    return isFieldInvalid(this.form.controls[control], this.failure(), control);
  }

  /**
   * Where the guard wanted to send them.
   *
   * Only a path on this site is accepted. A `returnUrl` is attacker-controlled —
   * it is in the query string — so letting it be an absolute URL would turn the
   * sign-in page into an open redirect: a convincing phishing link that really does
   * sign you in and then drops you on someone else's site.
   */
  private returnUrl(): string | null {
    const requested = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
    if (typeof requested !== 'string' || !requested.startsWith('/') || requested.startsWith('//')) {
      return null;
    }
    return requested;
  }
}
