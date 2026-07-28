import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

/** Shared across browser tabs so customer and driver (on separate tabs/devices) see the same orders. */
const STORAGE_KEY = 'bossa.dispatch.orders';

export type ServiceKey = 'food' | 'grocery' | 'pharmacy' | 'parcel' | 'shuttle' | 'shopping';

export interface ServiceDef {
  key: ServiceKey;
  title: string;
  blurb: string;
  isShuttle: boolean;
  needsItems: boolean;
  /** Merchant services go to a registered business first (food/grocery/pharmacy). */
  merchant: boolean;
  itemsLabel: string;
  baseFee: number;
  perKm: number;
}

export type OrderStatus =
  | 'placed' // sent to a business, awaiting confirmation
  | 'preparing' // business is preparing the order
  | 'finding' // searching for a driver
  | 'accepted'
  | 'arriving'
  | 'in_transit'
  | 'delivered'
  | 'rated'
  | 'declined'
  | 'cancelled';

export interface Driver {
  email: string;
  name: string;
  vehicle: string;
  plate: string;
  rating: number;
}

export interface Order {
  id: string;
  service: ServiceKey;
  serviceTitle: string;
  isShuttle: boolean;
  merchant: boolean;
  customerEmail: string;
  customerName: string;
  pickup: string;
  dropoff: string;
  items?: string;
  distanceKm: number;
  fee: number;
  etaMinutes: number;
  status: OrderStatus;
  driver?: Driver;
  businessEmail?: string;
  businessName?: string;
  declinedBy: string[];
  placedAt: number;
  acceptedAt?: number;
  readyAt?: number;
  completedAt?: number;
  rating?: number;
}

/** Share of the fee kept by the driver (platform commission is 15% per the proposal). */
const DRIVER_SHARE = 0.85;

/** Emails of drivers currently online, shared across tabs, so decline knows when everyone has passed. */
const PRESENCE_KEY = 'bossa.drivers.online';

@Injectable({ providedIn: 'root' })
export class DispatchService {
  private auth = inject(AuthService);
  private zone = inject(NgZone);
  private notify = inject(NotificationService);

  readonly services: ServiceDef[] = [
    { key: 'food', title: 'Food Delivery', blurb: 'Restaurants & takeaways nearby', isShuttle: false, needsItems: true, merchant: true, itemsLabel: 'What would you like to order?', baseFee: 22, perKm: 7 },
    { key: 'grocery', title: 'Grocery Delivery', blurb: 'Spaza shops & supermarkets', isShuttle: false, needsItems: true, merchant: true, itemsLabel: 'Your shopping list', baseFee: 25, perKm: 7 },
    { key: 'pharmacy', title: 'Pharmacy Delivery', blurb: 'Medicine & essentials', isShuttle: false, needsItems: true, merchant: true, itemsLabel: 'What do you need collected?', baseFee: 20, perKm: 6 },
    { key: 'parcel', title: 'Parcel Delivery', blurb: 'Send a package across town', isShuttle: false, needsItems: true, merchant: false, itemsLabel: 'Describe the parcel', baseFee: 18, perKm: 8 },
    { key: 'shuttle', title: 'Shuttle Service', blurb: 'Request a ride nearby', isShuttle: true, needsItems: false, merchant: false, itemsLabel: '', baseFee: 15, perKm: 9 },
    { key: 'shopping', title: 'Personal Shopping', blurb: 'A shopper picks it up for you', isShuttle: false, needsItems: true, merchant: false, itemsLabel: 'What should we buy?', baseFee: 28, perKm: 7 },
  ];

  private readonly ordersSig = signal<Order[]>([]);
  private readonly onlineSig = signal(true);

  readonly orders = this.ordersSig.asReadonly();
  readonly driverOnline = this.onlineSig.asReadonly();

  constructor() {
    this.ordersSig.set(this.readStore());
    if (typeof window !== 'undefined') {
      // Another tab (e.g. the driver) changed the shared store — pull it in live.
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.zone.run(() => this.ordersSig.set(this.readStore()));
        }
      });
    }
  }

  private readStore(): Order[] {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? (JSON.parse(raw) as Order[]) : [];
    } catch {
      return [];
    }
  }

  private writeStore(next: Order[]): void {
    this.ordersSig.set(next);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      /* storage unavailable or full — keep the in-memory copy */
    }
  }

  // ---- Customer views (scoped to the signed-in customer) ----
  readonly myOrders = computed<Order[]>(() => {
    const email = this.auth.currentUser()?.email;
    return this.ordersSig().filter((o) => o.customerEmail === email);
  });
  readonly myActiveOrder = computed<Order | null>(() => {
    const live = this.myOrders().filter((o) => this.isLive(o));
    return live.length ? live[0] : null;
  });

  // ---- Driver views (scoped to the signed-in driver) ----
  readonly incomingRequests = computed<Order[]>(() => {
    const email = this.auth.currentUser()?.email ?? '';
    if (!this.onlineSig()) return [];
    return this.ordersSig().filter(
      (o) => o.status === 'finding' && !o.declinedBy.includes(email),
    );
  });
  readonly myActiveTrip = computed<Order | null>(() => {
    const email = this.auth.currentUser()?.email;
    const live = this.ordersSig().filter(
      (o) => o.driver?.email === email && ['accepted', 'arriving', 'in_transit'].includes(o.status),
    );
    return live.length ? live[0] : null;
  });
  readonly myCompletedTrips = computed<Order[]>(() => {
    const email = this.auth.currentUser()?.email;
    return this.ordersSig().filter(
      (o) => o.driver?.email === email && (o.status === 'delivered' || o.status === 'rated'),
    );
  });
  readonly myEarnings = computed<number>(() =>
    this.myCompletedTrips().reduce((sum, o) => sum + this.driverEarning(o), 0),
  );

  // ---- Business views (scoped to the signed-in business) ----
  /** New merchant orders awaiting any business to accept. */
  readonly incomingBusinessOrders = computed<Order[]>(() =>
    this.ordersSig().filter((o) => o.status === 'placed'),
  );
  /** Orders this business accepted and is preparing. */
  readonly preparingOrders = computed<Order[]>(() => {
    const email = this.auth.currentUser()?.email;
    return this.ordersSig().filter((o) => o.businessEmail === email && o.status === 'preparing');
  });
  /** Orders this business has handed to a driver / completed. */
  readonly businessFulfilled = computed<Order[]>(() => {
    const email = this.auth.currentUser()?.email;
    return this.ordersSig().filter(
      (o) => o.businessEmail === email && ['finding', 'accepted', 'arriving', 'in_transit', 'delivered', 'rated'].includes(o.status),
    );
  });
  readonly businessCompleted = computed<Order[]>(() => {
    const email = this.auth.currentUser()?.email;
    return this.ordersSig().filter(
      (o) => o.businessEmail === email && (o.status === 'delivered' || o.status === 'rated'),
    );
  });

  isLive(o: Order): boolean {
    return ['placed', 'preparing', 'finding', 'accepted', 'arriving', 'in_transit'].includes(o.status);
  }

  driverEarning(o: Order): number {
    return Math.round(o.fee * DRIVER_SHARE);
  }

  /** Platform's 15% commission on a fare. */
  platformCut(o: Order): number {
    return o.fee - this.driverEarning(o);
  }

  /** Vehicle profile for the signed-in driver (from their editable account). */
  myDriverProfile(): { vehicle: string; plate: string; rating: number } {
    const user = this.auth.currentUser();
    return {
      vehicle: user?.vehicle ?? 'Registered vehicle',
      plate: user?.plate ?? '—',
      rating: user?.rating ?? 5.0,
    };
  }

  service(key: ServiceKey): ServiceDef | undefined {
    return this.services.find((s) => s.key === key);
  }

  order(id: string): Order | undefined {
    return this.readStore().find((o) => o.id === id);
  }

  toggleOnline(): void {
    this.onlineSig.update((v) => !v);
    this.setMyPresence(this.onlineSig());
  }

  /** Register the signed-in driver as present (called when the driver area loads). */
  enterPresence(): void {
    if (this.auth.role() === 'driver') this.setMyPresence(this.onlineSig());
  }

  /** Drop the signed-in driver from presence (called on leaving the driver area / logout). */
  leavePresence(): void {
    this.setMyPresence(false);
  }

  private readPresence(): string[] {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PRESENCE_KEY) : null;
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private setMyPresence(online: boolean): void {
    const email = this.auth.currentUser()?.email;
    if (!email) return;
    const set = new Set(this.readPresence());
    if (online) set.add(email);
    else set.delete(email);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PRESENCE_KEY, JSON.stringify([...set]));
      }
    } catch {
      /* ignore */
    }
  }

  /** Deterministic-ish distance so a fresh estimate is stable while typing. */
  estimateDistance(pickup: string, dropoff: string): number {
    const seed = (pickup + '→' + dropoff).length;
    const km = 1.6 + ((seed * 7) % 60) / 10; // 1.6 – 7.5 km
    return Math.round(km * 10) / 10;
  }

  quote(def: ServiceDef, distanceKm: number): { fee: number; etaMinutes: number } {
    const fee = Math.round(def.baseFee + def.perKm * distanceKm);
    const etaMinutes = Math.round(distanceKm * 3 + (def.isShuttle ? 2 : 8));
    return { fee, etaMinutes };
  }

  createOrder(input: {
    service: ServiceKey;
    pickup: string;
    dropoff: string;
    items?: string;
  }): Order {
    const def = this.service(input.service)!;
    const user = this.auth.currentUser();
    const distanceKm = this.estimateDistance(input.pickup, input.dropoff);
    const { fee, etaMinutes } = this.quote(def, distanceKm);
    const order: Order = {
      id: 'BC' + Date.now().toString().slice(-7),
      service: def.key,
      serviceTitle: def.title,
      isShuttle: def.isShuttle,
      merchant: def.merchant,
      customerEmail: user?.email ?? '',
      customerName: user?.fullName ?? 'Customer',
      pickup: input.pickup,
      dropoff: input.dropoff,
      items: input.items?.trim() || undefined,
      distanceKm,
      fee,
      etaMinutes,
      // Merchant orders wait for a business; everything else goes straight to drivers.
      status: def.merchant ? 'placed' : 'finding',
      declinedBy: [],
      placedAt: Date.now(),
    };
    this.writeStore([order, ...this.readStore()]);
    if (def.merchant) {
      this.notify.push({
        forRole: 'business',
        tone: 'info',
        title: 'New order received',
        body: `${order.serviceTitle} from ${order.customerName}${order.items ? ' · ' + order.items : ''}`,
        orderId: order.id,
      });
    } else {
      this.notifyDriversOfRequest(order);
    }
    return order;
  }

  private notifyDriversOfRequest(order: Order): void {
    this.notify.push({
      forRole: 'driver',
      tone: 'info',
      title: 'New request nearby',
      body: `${order.serviceTitle} · ${order.distanceKm} km · R${this.driverEarning(order)} for you`,
      orderId: order.id,
    });
  }

  /**
   * Driver accepts a request. Guarded so only a still-searching order can be
   * taken — if another driver grabbed it first, this returns false.
   */
  acceptOrder(id: string): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    const existing = this.order(id);
    if (!existing || existing.status !== 'finding') return false;
    const driver: Driver = {
      email: user.email,
      name: user.fullName,
      vehicle: user.vehicle ?? 'Registered vehicle',
      plate: user.plate ?? '—',
      rating: user.rating ?? 5.0,
    };
    this.patch(id, { status: 'accepted', driver, acceptedAt: Date.now() });
    this.notify.push({
      forEmail: existing.customerEmail,
      tone: 'success',
      title: 'Driver assigned',
      body: `${driver.name} (${driver.vehicle}) is on the way.`,
      orderId: existing.id,
    });
    return true;
  }

  /**
   * Driver passes on a request. It stays available to other online drivers and
   * is only marked 'declined' (visible to the customer) once every online driver
   * has passed on it.
   */
  declineOrder(id: string): void {
    const email = this.auth.currentUser()?.email ?? '';
    const order = this.order(id);
    if (!order) return;
    const declinedBy = order.declinedBy.includes(email)
      ? order.declinedBy
      : [...order.declinedBy, email];
    const online = this.readPresence();
    const everyoneDeclined = online.length > 0 && online.every((e) => declinedBy.includes(e));

    if (everyoneDeclined) {
      this.patch(id, { status: 'declined', declinedBy });
      this.notify.push({
        forEmail: order.customerEmail,
        tone: 'warn',
        title: 'Request declined',
        body: `No driver took your ${order.serviceTitle.toLowerCase()} request. You can send it again.`,
        orderId: order.id,
      });
    } else {
      // Still searching — just hide it from this driver.
      this.patch(id, { declinedBy });
    }
  }

  /** Customer re-broadcasts a declined/cancelled request. Merchant orders go back to a business. */
  reopenOrder(id: string): void {
    const order = this.order(id);
    if (!order) return;
    if (order.merchant) {
      this.patch(id, { status: 'placed', declinedBy: [], driver: undefined, businessEmail: undefined, businessName: undefined });
      this.notify.push({
        forRole: 'business',
        tone: 'info',
        title: 'New order received',
        body: `${order.serviceTitle} from ${order.customerName}`,
        orderId: order.id,
      });
    } else {
      this.patch(id, { status: 'finding', declinedBy: [], driver: undefined });
      this.notifyDriversOfRequest(order);
    }
  }

  // ---- Business actions ----
  /** Business accepts a new merchant order and starts preparing it. */
  businessAccept(id: string): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    const order = this.order(id);
    if (!order || order.status !== 'placed') return false;
    this.patch(id, { status: 'preparing', businessEmail: user.email, businessName: user.fullName });
    this.notify.push({
      forEmail: order.customerEmail,
      tone: 'info',
      title: 'Order confirmed',
      body: `${user.fullName} is preparing your ${order.serviceTitle.toLowerCase()}.`,
      orderId: order.id,
    });
    return true;
  }

  /** Business marks the order ready — this dispatches it to nearby drivers. */
  businessReady(id: string): void {
    const order = this.order(id);
    if (!order || order.status !== 'preparing') return;
    this.patch(id, { status: 'finding', readyAt: Date.now() });
    this.notifyDriversOfRequest(order);
    this.notify.push({
      forEmail: order.customerEmail,
      tone: 'success',
      title: 'Order ready',
      body: 'Your order is ready — finding a driver to collect it.',
      orderId: order.id,
    });
  }

  /** Business rejects a new order (e.g. out of stock). */
  businessReject(id: string): void {
    const order = this.order(id);
    if (!order) return;
    this.patch(id, { status: 'declined' });
    this.notify.push({
      forEmail: order.customerEmail,
      tone: 'warn',
      title: 'Order declined',
      body: `The store couldn't take your ${order.serviceTitle.toLowerCase()} order. You can try again.`,
      orderId: order.id,
    });
  }

  /** Driver moves the accepted trip forward one step. */
  advanceTrip(id: string): void {
    const flow: OrderStatus[] = ['accepted', 'arriving', 'in_transit', 'delivered'];
    const order = this.order(id);
    if (!order) return;
    const idx = flow.indexOf(order.status);
    if (idx < 0 || idx >= flow.length - 1) return;
    const nextStatus = flow[idx + 1];
    this.patch(id, {
      status: nextStatus,
      ...(nextStatus === 'delivered' ? { completedAt: Date.now() } : {}),
    });
    if (nextStatus === 'delivered') {
      this.notify.push({
        forEmail: order.customerEmail,
        tone: 'success',
        title: order.isShuttle ? 'Trip completed' : 'Delivered',
        body: order.isShuttle
          ? 'You have arrived. Rate your driver.'
          : 'Your order was delivered. Rate your driver.',
        orderId: order.id,
      });
    }
  }

  /** Label for the driver's next action button. */
  nextActionLabel(o: Order): string | null {
    switch (o.status) {
      case 'accepted': return o.isShuttle ? 'Arrived at pickup' : 'Heading to collect';
      case 'arriving': return o.isShuttle ? 'Passenger on board — start trip' : 'Picked up — start delivery';
      case 'in_transit': return o.isShuttle ? 'Complete trip' : 'Complete delivery';
      default: return null;
    }
  }

  rateOrder(id: string, rating: number): void {
    const order = this.order(id);
    this.patch(id, { rating, status: 'rated' });
    if (order?.driver) {
      this.notify.push({
        forEmail: order.driver.email,
        tone: 'success',
        title: `${rating}★ rating received`,
        body: `${order.customerName} rated your ${order.serviceTitle.toLowerCase()}.`,
        orderId: order.id,
      });
    }
  }

  /** Customer cancels — works while searching or after a driver is assigned. */
  cancelOrder(id: string): void {
    const order = this.order(id);
    this.patch(id, { status: 'cancelled' });
    if (order?.driver) {
      this.notify.push({
        forEmail: order.driver.email,
        tone: 'warn',
        title: 'Trip cancelled',
        body: `${order.customerName} cancelled the ${order.serviceTitle.toLowerCase()}.`,
        orderId: order.id,
      });
    }
  }

  /** Driver returns an accepted job to the pool so it can be picked up again. */
  driverCancel(id: string): void {
    const order = this.order(id);
    this.patch(id, { status: 'finding', driver: undefined, acceptedAt: undefined });
    if (order) {
      this.notify.push({
        forEmail: order.customerEmail,
        tone: 'warn',
        title: 'Driver cancelled',
        body: 'Your driver had to cancel — finding you another.',
        orderId: order.id,
      });
    }
  }

  private patch(id: string, patch: Partial<Order>): void {
    this.writeStore(this.readStore().map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }
}
