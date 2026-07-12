import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../state/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected readonly obscure = signal(true);
  protected readonly loading = signal(false);
  protected readonly submitted = signal(false);
  protected readonly authError = signal<string | null>(null);
  protected readonly forgotHint = signal(false);

  protected readonly demoAccounts = this.auth.demoAccounts;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected toggleObscure(): void {
    this.obscure.update((v) => !v);
  }

  protected fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
    this.authError.set(null);
    this.forgotHint.set(false);
  }

  protected forgotPassword(): void {
    this.forgotHint.set(true);
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.authError.set(null);
    if (this.form.invalid) return;
    this.loading.set(true);
    await new Promise((r) => setTimeout(r, 450));
    const { email, password } = this.form.getRawValue();
    const error = this.auth.login(email, password);
    this.loading.set(false);
    if (error) {
      this.authError.set(error);
      return;
    }
    this.router.navigate(['/dashboard']);
  }

  protected emailError(): string | null {
    const c = this.form.controls.email;
    if (!this.submitted() || c.valid) return null;
    if (c.hasError('required')) return 'Email is required';
    if (c.hasError('email')) return 'Enter a valid email';
    return null;
  }

  protected passwordError(): string | null {
    const c = this.form.controls.password;
    if (!this.submitted() || c.valid) return null;
    return 'Password is required';
  }
}
