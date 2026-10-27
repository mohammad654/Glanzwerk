import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SERVICES } from '../../../core/service-catalog';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-appointment',
  imports: [IconComponent, ReactiveFormsModule],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.scss',
})
export class AppointmentComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly services = SERVICES.map((service) => service.title);

  readonly timeSlots = [
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '13:00 - 15:00',
    '15:00 - 17:00',
  ];

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    service: ['', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
  });

  readonly submitted = signal(false);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Nothing is sent yet — the booking endpoint arrives with the backend.
    this.submitted.set(true);
    this.form.reset();
  }

  isInvalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.invalid && field.touched;
  }
}
