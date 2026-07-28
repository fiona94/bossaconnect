import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../state/auth.service';
import { DispatchService } from '../../../state/dispatch.service';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './profile.html',
  styleUrl: '../../customer/profile/profile.css',
})
export class AdminProfile {
  private auth = inject(AuthService);
  private dispatch = inject(DispatchService);
  private router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly totalOrders = this.dispatch.orders;

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
