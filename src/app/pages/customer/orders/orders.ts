import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerService, Order } from '../../../state/customer.service';
import { ServiceIcon } from '../../../shared/service-icon';

@Component({
  selector: 'app-customer-orders',
  imports: [RouterLink, ServiceIcon],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class CustomerOrders {
  private customer = inject(CustomerService);

  protected readonly orders = this.customer.history;

  protected statusLabel(o: Order): string {
    switch (o.status) {
      case 'finding': return 'Finding a driver';
      case 'accepted': return 'Driver assigned';
      case 'arriving': return o.isShuttle ? 'Heading to you' : 'Collecting order';
      case 'in_transit': return o.isShuttle ? 'On the trip' : 'Out for delivery';
      case 'delivered': return o.isShuttle ? 'Trip completed' : 'Delivered';
      case 'rated': return 'Completed';
      case 'cancelled': return 'Cancelled';
    }
  }

  protected isLive(o: Order): boolean {
    return o.status !== 'delivered' && o.status !== 'rated' && o.status !== 'cancelled';
  }
}
