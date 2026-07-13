import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerService, Order, OrderStatus } from '../../../state/customer.service';
import { ServiceIcon } from '../../../shared/service-icon';

interface Step {
  key: OrderStatus;
  label: string;
}

@Component({
  selector: 'app-track-order',
  imports: [RouterLink, ServiceIcon],
  templateUrl: './track.html',
  styleUrl: './track.css',
})
export class TrackOrder {
  private route = inject(ActivatedRoute);
  private customer = inject(CustomerService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly order = computed<Order | undefined>(() =>
    this.customer.orders().find((o) => o.id === this.id),
  );

  protected readonly hoverRating = signal(0);

  protected steps(o: Order): (Step & { done: boolean; current: boolean })[] {
    const base: Step[] = [
      { key: 'finding', label: 'Finding a driver' },
      { key: 'accepted', label: 'Driver assigned' },
      { key: 'arriving', label: o.isShuttle ? 'Driver heading to you' : 'Collecting your order' },
      { key: 'in_transit', label: o.isShuttle ? 'On the trip' : 'Out for delivery' },
      { key: 'delivered', label: o.isShuttle ? 'Trip completed' : 'Delivered' },
    ];
    const order: OrderStatus[] = ['finding', 'accepted', 'arriving', 'in_transit', 'delivered'];
    const activeStatus: OrderStatus = o.status === 'rated' ? 'delivered' : o.status;
    const currentIdx = order.indexOf(activeStatus);
    return base.map((s, i) => {
      const reached = i <= currentIdx;
      const current = i === currentIdx && o.status !== 'rated';
      return { ...s, current, done: reached && !current };
    });
  }

  protected isComplete(o: Order): boolean {
    return o.status === 'delivered' || o.status === 'rated';
  }

  protected mapStage(o: Order): number {
    const order: OrderStatus[] = ['finding', 'accepted', 'arriving', 'in_transit', 'delivered'];
    const s: OrderStatus = o.status === 'rated' ? 'delivered' : o.status;
    return Math.max(0, order.indexOf(s));
  }

  protected setHover(n: number): void {
    this.hoverRating.set(n);
  }

  protected rate(o: Order, n: number): void {
    this.customer.rateOrder(o.id, n);
  }
}
