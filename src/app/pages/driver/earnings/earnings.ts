import { Component, computed, inject } from '@angular/core';
import { DispatchService, Order } from '../../../state/dispatch.service';
import { ServiceIcon } from '../../../shared/service-icon';

@Component({
  selector: 'app-driver-earnings',
  imports: [ServiceIcon],
  templateUrl: './earnings.html',
  styleUrl: './earnings.css',
})
export class DriverEarnings {
  private dispatch = inject(DispatchService);

  protected readonly trips = this.dispatch.myCompletedTrips;
  protected readonly total = this.dispatch.myEarnings;
  protected readonly tripCount = computed(() => this.trips().length);
  protected readonly avgRating = computed(() => {
    const rated = this.trips().filter((t) => t.rating);
    if (!rated.length) return null;
    const sum = rated.reduce((a, t) => a + (t.rating ?? 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  });

  protected earning(o: Order): number {
    return this.dispatch.driverEarning(o);
  }
}
