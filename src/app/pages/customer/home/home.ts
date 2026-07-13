import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../state/auth.service';
import { CustomerService, Order } from '../../../state/customer.service';
import { ServiceIcon } from '../../../shared/service-icon';

@Component({
  selector: 'app-customer-home',
  imports: [RouterLink, ServiceIcon],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class CustomerHome {
  private auth = inject(AuthService);
  private customer = inject(CustomerService);

  protected readonly services = this.customer.services;
  protected readonly activeOrder = this.customer.activeOrder;
  protected readonly recent = computed(() => this.customer.history().slice(0, 4));

  protected readonly firstName = computed(() => this.auth.currentUser()?.fullName.split(' ')[0] ?? '');

  protected statusLabel(o: Order): string {
    switch (o.status) {
      case 'finding': return 'Finding a driver…';
      case 'accepted': return 'Driver assigned';
      case 'arriving': return 'Driver on the way to pickup';
      case 'in_transit': return o.isShuttle ? 'On the trip' : 'Out for delivery';
      case 'delivered': return o.isShuttle ? 'Trip completed' : 'Delivered';
      case 'rated': return 'Completed';
      case 'cancelled': return 'Cancelled';
    }
  }
}
