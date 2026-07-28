import { Component, inject } from '@angular/core';
import { DispatchService, Order } from '../../../state/dispatch.service';
import { ServiceIcon } from '../../../shared/service-icon';

@Component({
  selector: 'app-business-orders',
  imports: [ServiceIcon],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class BusinessOrders {
  private dispatch = inject(DispatchService);

  protected readonly incoming = this.dispatch.incomingBusinessOrders;
  protected readonly preparing = this.dispatch.preparingOrders;

  protected accept(o: Order): void {
    this.dispatch.businessAccept(o.id);
  }

  protected reject(o: Order): void {
    this.dispatch.businessReject(o.id);
  }

  protected ready(o: Order): void {
    this.dispatch.businessReady(o.id);
  }
}
