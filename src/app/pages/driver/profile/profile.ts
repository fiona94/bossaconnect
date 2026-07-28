import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../state/auth.service';
import { DispatchService } from '../../../state/dispatch.service';

@Component({
  selector: 'app-driver-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['../../customer/profile/profile.css', './profile.css'],
})
export class DriverProfile {
  private auth = inject(AuthService);
  private dispatch = inject(DispatchService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly online = this.dispatch.driverOnline;
  protected readonly trips = this.dispatch.myCompletedTrips;
  protected readonly earnings = this.dispatch.myEarnings;
  protected readonly editing = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    cellNumber: [''],
    vehicle: [''],
    plate: [''],
  });

  protected startEdit(): void {
    const u = this.user();
    this.form.setValue({
      fullName: u?.fullName ?? '',
      cellNumber: u?.cellNumber ?? '',
      vehicle: u?.vehicle ?? '',
      plate: u?.plate ?? '',
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

  protected toggleOnline(): void {
    this.dispatch.toggleOnline();
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
