import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DispatchService, Order } from '../../../state/dispatch.service';
import { NotificationService } from '../../../state/notification.service';
import { ServiceIcon } from '../../../shared/service-icon';

@Component({
  selector: 'app-driver-requests',
  imports: [ServiceIcon, RouterLink],
  templateUrl: './requests.html',
  styleUrl: './requests.css',
})
export class DriverRequests {
  private dispatch = inject(DispatchService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  protected readonly requests = this.dispatch.incomingRequests;
  protected readonly online = this.dispatch.driverOnline;
  protected readonly activeTrip = this.dispatch.myActiveTrip;

  protected earning(o: Order): number {
    return this.dispatch.driverEarning(o);
  }

  protected accept(o: Order): void {
    if (this.dispatch.acceptOrder(o.id)) {
      this.router.navigate(['/driver/trip']);
    } else {
      this.notify.flash('warn', 'Already taken', 'Another driver accepted this request first.');
    }
  }

  protected decline(o: Order): void {
    this.dispatch.declineOrder(o.id);
  }

  protected goOnline(): void {
    if (!this.online()) this.dispatch.toggleOnline();
  }
}
