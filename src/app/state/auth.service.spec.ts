import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
  });

  it('starts logged out', () => {
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.role()).toBeNull();
  });

  it('exposes four demo accounts', () => {
    expect(auth.demoAccounts.length).toBe(4);
    expect(auth.demoAccounts.map((a) => a.role)).toEqual([
      'customer',
      'driver',
      'business',
      'admin',
    ]);
  });

  it('logs in each demo account with the correct role', () => {
    for (const account of auth.demoAccounts) {
      expect(auth.login(account.email, account.password)).toBeNull();
      expect(auth.role()).toBe(account.role);
      auth.logout();
    }
  });

  it('rejects a wrong password', () => {
    const account = auth.demoAccounts[0];
    expect(auth.login(account.email, 'wrong')).toBe('Incorrect password. Please try again.');
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('rejects an unknown email', () => {
    expect(auth.login('nobody@bossaconnect.app', 'x')).toBe('No account found for this email.');
  });

  it('registers a new customer and logs them in', () => {
    expect(auth.register('New Person', 'new@bossaconnect.app', 'Passw0rd')).toBeNull();
    expect(auth.role()).toBe('customer');
  });

  it('prevents duplicate registration', () => {
    const existing = auth.demoAccounts[0].email;
    expect(auth.register('Dup', existing, 'Passw0rd')).toBe(
      'An account with this email already exists.',
    );
  });
});
