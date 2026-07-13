import { Injectable, computed, signal } from '@angular/core';

export type ServiceKey = 'food' | 'grocery' | 'pharmacy' | 'parcel' | 'shuttle' | 'shopping';

export interface ServiceDef {
  key: ServiceKey;
  title: string;
  blurb: string;
  /** Shuttle carries passengers — uses "fare"/"destination" wording instead of delivery. */
  isShuttle: boolean;
  /** Merchant services ask what the customer wants collected. */
  needsItems: boolean;
  itemsLabel: string;
  baseFee: number;
  perKm: number;
}

export type OrderStatus =
  | 'finding'
  | 'accepted'
  | 'arriving'
  | 'in_transit'
  | 'delivered'
  | 'rated'
  | 'cancelled';

export interface Driver {
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
  pickup: string;
  dropoff: string;
  items?: string;
  distanceKm: number;
  fee: number;
  etaMinutes: number;
  status: OrderStatus;
  driver?: Driver;
  placedAt: number;
  rating?: number;
}

const DRIVER_POOL: Record<'scooter' | 'car' | 'motorbike', Driver[]> = {
  scooter: [
    { name: 'Bongani M.', vehicle: 'Scooter · Red Vespa', plate: 'JHB 42 GP', rating: 4.8 },
    { name: 'Lerato P.', vehicle: 'Scooter · Honda', plate: 'CA 771 219', rating: 4.9 },
  ],
  car: [
    { name: 'Musa K.', vehicle: 'Toyota Avanza · White', plate: 'ND 118 776', rating: 4.7 },
    { name: 'Zanele T.', vehicle: 'VW Polo · Silver', plate: 'BP 63 NW', rating: 4.9 },
  ],
  motorbike: [
    { name: 'Sipho D.', vehicle: 'Motorbike · Yamaha', plate: 'GP 907 214', rating: 4.6 },
    { name: 'Kabelo N.', vehicle: 'Motorbike · Bajaj', plate: 'MP 55 331', rating: 4.8 },
  ],
};

@Injectable({ providedIn: 'root' })
export class CustomerService {
  readonly services: ServiceDef[] = [
    { key: 'food', title: 'Food Delivery', blurb: 'Restaurants & takeaways nearby', isShuttle: false, needsItems: true, itemsLabel: 'What would you like to order?', baseFee: 22, perKm: 7 },
    { key: 'grocery', title: 'Grocery Delivery', blurb: 'Spaza shops & supermarkets', isShuttle: false, needsItems: true, itemsLabel: 'Your shopping list', baseFee: 25, perKm: 7 },
    { key: 'pharmacy', title: 'Pharmacy Delivery', blurb: 'Medicine & essentials', isShuttle: false, needsItems: true, itemsLabel: 'What do you need collected?', baseFee: 20, perKm: 6 },
    { key: 'parcel', title: 'Parcel Delivery', blurb: 'Send a package across town', isShuttle: false, needsItems: true, itemsLabel: 'Describe the parcel', baseFee: 18, perKm: 8 },
    { key: 'shuttle', title: 'Shuttle Service', blurb: 'Request a ride nearby', isShuttle: true, needsItems: false, itemsLabel: '', baseFee: 15, perKm: 9 },
    { key: 'shopping', title: 'Personal Shopping', blurb: 'A shopper picks it up for you', isShuttle: false, needsItems: true, itemsLabel: 'What should we buy?', baseFee: 28, perKm: 7 },
  ];

  private readonly ordersSig = signal<Order[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>[]>();

  readonly orders = this.ordersSig.asReadonly();

  /** Most recent order still in progress, if any. */
  readonly activeOrder = computed<Order | null>(() => {
    const live = this.ordersSig().filter(
      (o) => o.status !== 'delivered' && o.status !== 'rated' && o.status !== 'cancelled',
    );
    return live.length ? live[0] : null;
  });

  readonly history = computed<Order[]>(() => this.ordersSig());

  service(key: ServiceKey): ServiceDef | undefined {
    return this.services.find((s) => s.key === key);
  }

  order(id: string): Order | undefined {
    return this.ordersSig().find((o) => o.id === id);
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
    const distanceKm = this.estimateDistance(input.pickup, input.dropoff);
    const { fee, etaMinutes } = this.quote(def, distanceKm);
    const order: Order = {
      id: 'BC' + Date.now().toString().slice(-7),
      service: def.key,
      serviceTitle: def.title,
      isShuttle: def.isShuttle,
      pickup: input.pickup,
      dropoff: input.dropoff,
      items: input.items?.trim() || undefined,
      distanceKm,
      fee,
      etaMinutes,
      status: 'finding',
      placedAt: Date.now(),
    };
    this.ordersSig.set([order, ...this.ordersSig()]);
    this.simulate(order);
    return order;
  }

  rateOrder(id: string, rating: number): void {
    this.patch(id, { rating, status: 'rated' });
  }

  cancelOrder(id: string): void {
    this.clearTimers(id);
    this.patch(id, { status: 'cancelled' });
  }

  /** Drive the order through its lifecycle on timers, like a live dispatch. */
  private simulate(order: Order): void {
    const pool =
      order.service === 'shuttle'
        ? DRIVER_POOL.car
        : order.service === 'parcel'
          ? DRIVER_POOL.motorbike
          : DRIVER_POOL.scooter;
    const driver = pool[Math.floor(Math.random() * pool.length)];

    const steps: { delay: number; patch: Partial<Order> }[] = [
      { delay: 2200, patch: { status: 'accepted', driver } },
      { delay: 5200, patch: { status: 'arriving' } },
      { delay: 8600, patch: { status: 'in_transit' } },
      { delay: 12500, patch: { status: 'delivered' } },
    ];

    const handles = steps.map((step) =>
      setTimeout(() => {
        const current = this.order(order.id);
        if (!current || current.status === 'cancelled') return;
        this.patch(order.id, step.patch);
      }, step.delay),
    );
    this.timers.set(order.id, handles);
  }

  private patch(id: string, patch: Partial<Order>): void {
    this.ordersSig.set(
      this.ordersSig().map((o) => (o.id === id ? { ...o, ...patch } : o)),
    );
  }

  private clearTimers(id: string): void {
    (this.timers.get(id) ?? []).forEach(clearTimeout);
    this.timers.delete(id);
  }
}
