import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../state/auth.service';
import { CustomerService } from '../../../state/customer.service';

@Component({
  selector: 'app-customer-profile',
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class CustomerProfile {
  private auth = inject(AuthService);
  private customer = inject(CustomerService);
  private router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly tripCount = computed(() => this.customer.history().length);
  protected readonly completed = computed(
    () => this.customer.history().filter((o) => o.status === 'rated' || o.status === 'delivered').length,
  );

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
