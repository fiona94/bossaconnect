import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DispatchService, Order, OrderStatus } from '../../../state/dispatch.service';
import { ServiceIcon } from '../../../shared/service-icon';

@Component({
  selector: 'app-driver-trip',
  imports: [ServiceIcon],
  templateUrl: './trip.html',
  styleUrl: './trip.css',
})
export class DriverTrip {
  private dispatch = inject(DispatchService);
  private router = inject(Router);

  protected readonly trip = this.dispatch.myActiveTrip;

  /** Set when the driver completes a trip on this screen, to show a one-off summary. */
  private readonly completedId = signal<string | null>(null);
  protected readonly completed = computed<Order | null>(() => {
    const id = this.completedId();
    return id ? (this.dispatch.order(id) ?? null) : null;
  });

  protected earning(o: Order): number {
    return this.dispatch.driverEarning(o);
  }

  protected nextLabel(o: Order): string | null {
    return this.dispatch.nextActionLabel(o);
  }

  protected phase(o: Order): string {
    const map: Record<OrderStatus, string> = {
      placed: 'At store',
      preparing: 'Preparing',
      finding: 'Finding',
      accepted: o.isShuttle ? 'Heading to pickup' : 'Heading to collect',
      arriving: o.isShuttle ? 'At pickup' : 'Collecting order',
      in_transit: o.isShuttle ? 'On the trip' : 'Delivering',
      delivered: 'Completed',
      rated: 'Completed',
      declined: 'Declined',
      cancelled: 'Cancelled',
    };
    return map[o.status];
  }

  protected advance(o: Order): void {
    const wasLast = o.status === 'in_transit';
    this.dispatch.advanceTrip(o.id);
    if (wasLast) this.completedId.set(o.id);
  }

  protected cancelJob(o: Order): void {
    this.dispatch.driverCancel(o.id);
    this.router.navigate(['/driver']);
  }

  protected findNext(): void {
    this.completedId.set(null);
    this.router.navigate(['/driver']);
  }
}
