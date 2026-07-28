import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DispatchService, Order } from '../../../state/dispatch.service';
import { ServiceIcon } from '../../../shared/service-icon';

@Component({
  selector: 'app-customer-orders',
  imports: [RouterLink, ServiceIcon],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class CustomerOrders {
  private dispatch = inject(DispatchService);

  protected readonly orders = this.dispatch.myOrders;

  protected statusLabel(o: Order): string {
    switch (o.status) {
      case 'placed': return 'At the store';
      case 'preparing': return 'Preparing';
      case 'finding': return 'Finding a driver';
      case 'accepted': return 'Driver assigned';
      case 'arriving': return o.isShuttle ? 'Heading to you' : 'Collecting order';
      case 'in_transit': return o.isShuttle ? 'On the trip' : 'Out for delivery';
      case 'delivered': return o.isShuttle ? 'Trip completed' : 'Delivered';
      case 'rated': return 'Completed';
      case 'declined': return 'Declined';
      case 'cancelled': return 'Cancelled';
    }
  }

  protected isLive(o: Order): boolean {
    return this.dispatch.isLive(o);
  }
}
