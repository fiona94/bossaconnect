import { Component, computed, inject } from '@angular/core';
import { AuthService, UserRole } from '../../../state/auth.service';
import { DispatchService, Order, OrderStatus } from '../../../state/dispatch.service';

@Component({
  selector: 'app-admin-overview',
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class AdminOverview {
  private dispatch = inject(DispatchService);
  private auth = inject(AuthService);

  protected readonly orders = this.dispatch.orders;

  protected readonly active = computed(() => this.orders().filter((o) => this.dispatch.isLive(o)));
  protected readonly completed = computed(() =>
    this.orders().filter((o) => o.status === 'delivered' || o.status === 'rated'),
  );
  protected readonly commission = computed(() =>
    this.completed().reduce((sum, o) => sum + this.dispatch.platformCut(o), 0),
  );
  protected readonly gmv = computed(() => this.completed().reduce((sum, o) => sum + o.fee, 0));

  private readonly users = computed(() => this.auth.listUsers());
  protected readonly roleCounts = computed(() => {
    const counts: Record<UserRole, number> = { customer: 0, driver: 0, business: 0, admin: 0 };
    for (const u of this.users()) counts[u.role]++;
    return counts;
  });

  protected readonly liveOrders = computed(() =>
    [...this.active()].sort((a, b) => b.placedAt - a.placedAt),
  );

  protected statusLabel(s: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      placed: 'At store',
      preparing: 'Preparing',
      finding: 'Finding driver',
      accepted: 'Driver assigned',
      arriving: 'Collecting',
      in_transit: 'In transit',
      delivered: 'Delivered',
      rated: 'Completed',
      declined: 'Declined',
      cancelled: 'Cancelled',
    };
    return map[s];
  }

  protected handler(o: Order): string {
    if (o.driver) return o.driver.name;
    if (o.businessName) return o.businessName;
    return '—';
  }
}
