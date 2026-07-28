import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DispatchService, Order, OrderStatus } from '../../../state/dispatch.service';
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
  private dispatch = inject(DispatchService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly order = computed<Order | undefined>(() =>
    this.dispatch.orders().find((o) => o.id === this.id),
  );

  protected readonly hoverRating = signal(0);

  private flow(o: Order): OrderStatus[] {
    const tail: OrderStatus[] = ['finding', 'accepted', 'arriving', 'in_transit', 'delivered'];
    return o.merchant ? ['placed', 'preparing', ...tail] : tail;
  }

  protected steps(o: Order): (Step & { done: boolean; current: boolean })[] {
    const shop = o.businessName ?? 'the store';
    const labels: Partial<Record<OrderStatus, string>> = {
      placed: 'Sent to the store',
      preparing: `Preparing at ${shop}`,
      finding: 'Finding a driver',
      accepted: 'Driver assigned',
      arriving: o.isShuttle ? 'Driver heading to you' : 'Collecting your order',
      in_transit: o.isShuttle ? 'On the trip' : 'Out for delivery',
      delivered: o.isShuttle ? 'Trip completed' : 'Delivered',
    };
    const order = this.flow(o);
    const activeStatus: OrderStatus = o.status === 'rated' ? 'delivered' : o.status;
    const currentIdx = order.indexOf(activeStatus);
    return order.map((key, i) => {
      const reached = i <= currentIdx;
      const current = i === currentIdx && o.status !== 'rated';
      return { key, label: labels[key] ?? key, current, done: reached && !current };
    });
  }

  protected isComplete(o: Order): boolean {
    return o.status === 'delivered' || o.status === 'rated';
  }

  protected mapStage(o: Order): number {
    const tail: OrderStatus[] = ['finding', 'accepted', 'arriving', 'in_transit', 'delivered'];
    const s: OrderStatus = o.status === 'rated' ? 'delivered' : o.status;
    return Math.max(0, tail.indexOf(s));
  }

  protected atBusiness(o: Order): boolean {
    return o.status === 'placed' || o.status === 'preparing';
  }

  protected setHover(n: number): void {
    this.hoverRating.set(n);
  }

  protected rate(o: Order, n: number): void {
    this.dispatch.rateOrder(o.id, n);
  }

  protected cancel(o: Order): void {
    this.dispatch.cancelOrder(o.id);
  }

  protected reopen(o: Order): void {
    this.dispatch.reopenOrder(o.id);
  }

  protected time(ts?: number): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
