import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../state/auth.service';
import { CustomerService } from '../../state/customer.service';

@Component({
  selector: 'app-customer-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './customer-shell.html',
  styleUrl: './customer-shell.css',
})
export class CustomerShell {
  private auth = inject(AuthService);
  private customer = inject(CustomerService);
  private router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly activeOrder = this.customer.activeOrder;
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
