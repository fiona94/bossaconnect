import { Component, computed, inject } from '@angular/core';
import { DispatchService, Order } from '../../../state/dispatch.service';
import { ServiceIcon } from '../../../shared/service-icon';

@Component({
  selector: 'app-business-history',
  imports: [ServiceIcon],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class BusinessHistory {
  private dispatch = inject(DispatchService);

  protected readonly fulfilled = this.dispatch.businessFulfilled;
  protected readonly completed = this.dispatch.businessCompleted;
  protected readonly delivered = computed(() => this.completed().length);

  protected statusLabel(o: Order): string {
    switch (o.status) {
      case 'finding': return 'Awaiting driver';
      case 'accepted': return 'Driver assigned';
      case 'arriving': return 'Being collected';
      case 'in_transit': return 'Out for delivery';
      case 'delivered': return 'Delivered';
      case 'rated': return 'Completed';
      default: return o.status;
    }
  }

  protected isActive(o: Order): boolean {
    return this.dispatch.isLive(o);
  }
}
