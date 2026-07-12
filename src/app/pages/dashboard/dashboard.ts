import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserRole } from '../../state/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private auth = inject(AuthService);
  private router = inject(Router);

  protected readonly user = this.auth.currentUser;

  private readonly copy: Record<UserRole, { title: string; blurb: string }> = {
    customer: {
      title: 'Customer dashboard',
      blurb: 'Request deliveries and shuttles, track your orders live and manage your account.',
    },
    driver: {
      title: 'Driver dashboard',
      blurb: 'Accept nearby requests, track your trips and keep a digital record of your earnings.',
    },
    business: {
      title: 'Business dashboard',
      blurb: 'Receive orders, dispatch nearby drivers and grow your customer base.',
    },
    admin: {
      title: 'Admin dashboard',
      blurb: 'Manage users, drivers, businesses and platform operations from one place.',
    },
  };

  protected readonly roleCopy = computed(() => {
    const role = this.user()?.role;
    return role ? this.copy[role] : { title: 'Dashboard', blurb: '' };
  });

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
