import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../state/auth.service';
import { DispatchService } from '../../../state/dispatch.service';

@Component({
  selector: 'app-customer-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class CustomerProfile {
  private auth = inject(AuthService);
  private dispatch = inject(DispatchService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly editing = signal(false);
  protected readonly tripCount = computed(() => this.dispatch.myOrders().length);
  protected readonly completed = computed(
    () => this.dispatch.myOrders().filter((o) => o.status === 'rated' || o.status === 'delivered').length,
  );

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    cellNumber: [''],
    area: [''],
  });

  protected startEdit(): void {
    const u = this.user();
    this.form.setValue({
      fullName: u?.fullName ?? '',
      cellNumber: u?.cellNumber ?? '',
      area: u?.area ?? '',
    });
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.editing.set(false);
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.auth.updateProfile(this.form.getRawValue());
    this.editing.set(false);
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
