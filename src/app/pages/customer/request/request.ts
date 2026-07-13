import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService, ServiceKey } from '../../../state/customer.service';
import { ServiceIcon } from '../../../shared/service-icon';

@Component({
  selector: 'app-request-flow',
  imports: [ReactiveFormsModule, RouterLink, ServiceIcon],
  templateUrl: './request.html',
  styleUrl: './request.css',
})
export class RequestFlow {
  private fb = inject(FormBuilder);
  private customer = inject(CustomerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly submitted = signal(false);
  protected readonly placing = signal(false);

  private readonly serviceKey = signal<ServiceKey>(
    (this.route.snapshot.paramMap.get('service') as ServiceKey) ?? 'food',
  );
  protected readonly def = computed(() => this.customer.service(this.serviceKey())!);

  protected readonly form = this.fb.nonNullable.group({
    pickup: ['', [Validators.required]],
    dropoff: ['', [Validators.required]],
    items: [''],
  });

  /** Live values drive the estimate as the user types. */
  private readonly formValue = signal(this.form.getRawValue());

  protected readonly estimate = computed(() => {
    const def = this.def();
    const { pickup, dropoff } = this.formValue();
    if (!pickup.trim() || !dropoff.trim()) return null;
    const distanceKm = this.customer.estimateDistance(pickup, dropoff);
    const { fee, etaMinutes } = this.customer.quote(def, distanceKm);
    return { distanceKm, fee, etaMinutes };
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.formValue.set(this.form.getRawValue()));
  }

  protected pickupLabel(): string {
    return this.def().isShuttle ? 'Pickup point' : 'Collect from';
  }

  protected dropoffLabel(): string {
    return this.def().isShuttle ? 'Destination' : 'Deliver to';
  }

  protected error(field: 'pickup' | 'dropoff'): boolean {
    return this.submitted() && this.form.controls[field].invalid;
  }

  protected async confirm(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.placing.set(true);
    await new Promise((r) => setTimeout(r, 400));
    const { pickup, dropoff, items } = this.form.getRawValue();
    const order = this.customer.createOrder({
      service: this.serviceKey(),
      pickup,
      dropoff,
      items,
    });
    this.router.navigate(['/customer/track', order.id]);
  }
}
