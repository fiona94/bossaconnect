import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../state/auth.service';
import { DispatchService } from '../../state/dispatch.service';
import { NotificationBell } from '../../shared/notification-bell';

@Component({
  selector: 'app-business-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBell],
  templateUrl: './business-shell.html',
  styleUrl: './business-shell.css',
})
export class BusinessShell {
  private auth = inject(AuthService);
  private dispatch = inject(DispatchService);
  private router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly activeCount = computed(
    () => this.dispatch.incomingBusinessOrders().length + this.dispatch.preparingOrders().length,
  );

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
