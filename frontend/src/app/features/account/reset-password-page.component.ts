import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiFailure, fieldError, toFailure } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { LINKS } from '../../core/routes';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { PasswordRulesComponent } from '../../shared/components/password-rules/password-rules.component';
import { isFieldInvalid } from '../../shared/form-field';
import { NEW_PASSWORD_VALIDATORS } from '../../shared/password-rules';

/** Both boxes must agree: a password nobody can see is a password easily mistyped. */
const passwordsMatch = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmation = group.get('confirmation')?.value;
  return !confirmation || password === confirmation ? null : { mismatch: true };
};

/**
 * Step two of a forgotten password: choose a new one.
 *
 * The token comes out of the query string, where the emailed link put it. It is read
 * once, from the snapshot: nothing on this page navigates, and re-reading it would
 * only invite a half-submitted form to change which account it is resetting.
 *
 * It does not sign the account in afterwards. The new password gets typed into the
 * sign-in form once, which proves it arrived intact and gives the browser's password
 * manager the prompt it needs to offer saving it.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reset-password-page',
  imports: [
    IconComponent,
    PageBannerComponent,
    PasswordRulesComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './reset-password-page.component.html',
})
export class ResetPasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly pageTitle = $localize`:@@page.resetPassword.h1:Choose A New Password`;
  readonly loginLink = LINKS.login;
  readonly forgotPasswordLink = LINKS.forgotPassword;

  /** Whatever the link carried. Empty means somebody arrived here without one. */
  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly hasToken = this.token !== '';

  readonly form = this.formBuilder.nonNullable.group(
    {
      password: ['', [...NEW_PASSWORD_VALIDATORS]],
      confirmation: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });

  readonly pending = signal(false);
  readonly failure = signal<ApiFailure | null>(null);
  readonly done = signal(false);

  readonly errorMessage = computed(() => {
    const failure = this.failure();
    if (!failure || Object.keys(failure.fieldErrors).length > 0) {
      return null;
    }
    // The one failure this endpoint produces without naming a field is a link that
    // is expired, already spent or simply wrong — the API says so in English only,
    // and this is a German-first site, so the wording is ours. Anything else keeps
    // the server's sentence, which is the only party that knows what it was.
    if (failure.status === 400) {
      return $localize`:@@resetPassword.linkInvalid:This reset link is no longer valid. Please ask for a new one.`;
    }
    return failure.message;
  });

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

    this.auth
      .resetPassword({ token: this.token, password: this.form.getRawValue().password })
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.done.set(true);
          // The link is spent, so the form has nothing left to do. Clearing it also
          // keeps the new password out of the DOM for longer than it is needed.
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

  /**
   * The two boxes disagree, and the user has been in the second one.
   *
   * A method rather than a `computed`, because a form group's validity and `touched`
   * are not signals: a computed reading them has nothing to invalidate it and would
   * answer with whatever was true the first time the template asked.
   */
  mismatch(): boolean {
    return this.form.hasError('mismatch') && this.form.controls.confirmation.touched;
  }
}
