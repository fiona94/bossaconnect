import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../state/auth.service';
import { DispatchService } from '../../state/dispatch.service';
import { NotificationBell } from '../../shared/notification-bell';

@Component({
  selector: 'app-driver-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationBell],
  templateUrl: './driver-shell.html',
  styleUrl: './driver-shell.css',
})
export class DriverShell {
  private auth = inject(AuthService);
  private dispatch = inject(DispatchService);
  private router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly online = this.dispatch.driverOnline;
  protected readonly requestCount = this.dispatch.incomingRequests;
  protected readonly activeTrip = this.dispatch.myActiveTrip;
  protected readonly menuOpen = signal(false);

  constructor() {
    // Mark this driver as online/present while they're in the driver area.
    this.dispatch.enterPresence();
    inject(DestroyRef).onDestroy(() => this.dispatch.leavePresence());
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected toggleOnline(): void {
    this.dispatch.toggleOnline();
  }

  protected logout(): void {
    this.dispatch.leavePresence();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
