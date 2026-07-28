import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../state/auth.service';
import { DispatchService, Order } from '../../../state/dispatch.service';
import { ServiceIcon } from '../../../shared/service-icon';

@Component({
  selector: 'app-customer-home',
  imports: [RouterLink, ServiceIcon],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class CustomerHome {
  private auth = inject(AuthService);
  private dispatch = inject(DispatchService);

  protected readonly services = this.dispatch.services;
  protected readonly activeOrder = this.dispatch.myActiveOrder;
  protected readonly recent = computed(() => this.dispatch.myOrders().slice(0, 4));

  protected readonly firstName = computed(() => this.auth.currentUser()?.fullName.split(' ')[0] ?? '');
  protected readonly area = computed(() => this.auth.currentUser()?.area || 'Set your area');

  protected statusLabel(o: Order): string {
    switch (o.status) {
      case 'placed': return 'Sent to the store…';
      case 'preparing': return 'Preparing your order…';
      case 'finding': return 'Finding a driver…';
      case 'accepted': return 'Driver assigned';
      case 'arriving': return 'Driver on the way to pickup';
      case 'in_transit': return o.isShuttle ? 'On the trip' : 'Out for delivery';
      case 'delivered': return o.isShuttle ? 'Trip completed' : 'Delivered';
      case 'rated': return 'Completed';
      case 'declined': return 'Declined';
      case 'cancelled': return 'Cancelled';
    }
  }
}
