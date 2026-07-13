import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../state/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: '../login/login.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected readonly obscure = signal(true);
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly authError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.passwordStrength]],
      confirm: ['', [Validators.required]],
    },
    { validators: [this.matchPasswords] },
  );

  protected toggleObscure(): void {
    this.obscure.update((v) => !v);
  }

  private passwordStrength(control: AbstractControl): ValidationErrors | null {
    const v: string = control.value || '';
    if (v.length < 8) return { minlen: true };
    if (!/[A-Z]/.test(v) || !/[0-9]/.test(v)) return { weak: true };
    return null;
  }

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const p = group.get('password')?.value;
    const c = group.get('confirm')?.value;
    return p === c ? null : { mismatch: true };
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.authError.set(null);
    if (this.form.invalid) return;
    this.loading.set(true);
    await new Promise((r) => setTimeout(r, 450));
    const { name, email, password } = this.form.getRawValue();
    const error = this.auth.register(name, email, password);
    this.loading.set(false);
    if (error) {
      this.authError.set(error);
      return;
    }
    this.router.navigate([this.auth.homePath()]);
  }

  protected fieldError(field: 'name' | 'email' | 'password' | 'confirm'): string | null {
    if (!this.submitted()) return null;
    const c = this.form.controls[field];
    if (c.valid && field !== 'confirm') return null;
    if (field === 'name' && c.hasError('required')) return 'Full name is required';
    if (field === 'email') {
      if (c.hasError('required')) return 'Email is required';
      if (c.hasError('email')) return 'Enter a valid email';
    }
    if (field === 'password') {
      if (c.hasError('required') || c.hasError('minlen')) return 'Use at least 8 characters';
      if (c.hasError('weak')) return 'Include an uppercase letter and a number';
    }
    if (field === 'confirm' && this.form.hasError('mismatch')) return 'Passwords do not match';
    return null;
  }
}
