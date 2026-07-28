import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { DispatchService } from './dispatch.service';

describe('DispatchService (multi-driver)', () => {
  let dispatch: DispatchService;
  let auth: AuthService;

  const CUSTOMER = { email: 'customer@bossaconnect.app', pw: 'Customer@123' };
  const DRIVER1 = { email: 'driver@bossaconnect.app', pw: 'Driver@123' };
  const DRIVER2 = { email: 'driver2@bossaconnect.app', pw: 'Driver@123' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    dispatch = TestBed.inject(DispatchService);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  // Use a non-merchant service so the order goes straight to drivers ('finding').
  function newOrder(): string {
    auth.login(CUSTOMER.email, CUSTOMER.pw);
    const order = dispatch.createOrder({ service: 'parcel', pickup: 'A', dropoff: 'B' });
    auth.logout();
    return order.id;
  }

  it('only lets the first driver accept a request', () => {
    const id = newOrder();

    auth.login(DRIVER1.email, DRIVER1.pw);
    expect(dispatch.acceptOrder(id)).toBe(true);
    auth.logout();

    // Second driver is too late — the order is no longer "finding".
    auth.login(DRIVER2.email, DRIVER2.pw);
    expect(dispatch.acceptOrder(id)).toBe(false);
    expect(dispatch.order(id)?.driver?.email).toBe(DRIVER1.email);
  });

  it('keeps a request searching until every online driver declines', () => {
    const id = newOrder();

    auth.login(DRIVER1.email, DRIVER1.pw);
    dispatch.enterPresence();
    auth.logout();
    auth.login(DRIVER2.email, DRIVER2.pw);
    dispatch.enterPresence();

    // Driver 2 passes — driver 1 could still take it.
    dispatch.declineOrder(id);
    expect(dispatch.order(id)?.status).toBe('finding');

    // Driver 1 also passes — now the customer sees it declined.
    auth.logout();
    auth.login(DRIVER1.email, DRIVER1.pw);
    dispatch.declineOrder(id);
    expect(dispatch.order(id)?.status).toBe('declined');
  });

  it('routes a merchant order through the business before drivers', () => {
    const BUSINESS = { email: 'business@bossaconnect.app', pw: 'Business@123' };

    auth.login(CUSTOMER.email, CUSTOMER.pw);
    const order = dispatch.createOrder({ service: 'food', pickup: 'KFC', dropoff: 'B' });
    // Merchant orders wait for a business, not drivers.
    expect(order.status).toBe('placed');
    auth.logout();

    // A driver cannot accept it while it's still at the business.
    auth.login(DRIVER1.email, DRIVER1.pw);
    expect(dispatch.acceptOrder(order.id)).toBe(false);
    auth.logout();

    // Business confirms → preparing → ready dispatches to drivers.
    auth.login(BUSINESS.email, BUSINESS.pw);
    expect(dispatch.businessAccept(order.id)).toBe(true);
    expect(dispatch.order(order.id)?.status).toBe('preparing');
    dispatch.businessReady(order.id);
    expect(dispatch.order(order.id)?.status).toBe('finding');
    auth.logout();

    // Now a driver can take it.
    auth.login(DRIVER1.email, DRIVER1.pw);
    expect(dispatch.acceptOrder(order.id)).toBe(true);
    expect(dispatch.order(order.id)?.businessEmail).toBe(BUSINESS.email);
  });
});
