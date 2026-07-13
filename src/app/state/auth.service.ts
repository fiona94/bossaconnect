import { Injectable, computed, signal } from '@angular/core';

export type UserRole = 'customer' | 'driver' | 'business' | 'admin';

export interface User {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

/** A demo account surfaced in the "Quick demo sign-in" panel. */
export interface DemoAccount {
  role: UserRole;
  label: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly users = new Map<string, User>();
  private readonly currentUserSig = signal<User | null>(null);

  readonly currentUser = this.currentUserSig.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUserSig() !== null);
  readonly role = computed<UserRole | null>(() => this.currentUserSig()?.role ?? null);

  /** Seed credentials shown on the login screen for quick access. */
  readonly demoAccounts: DemoAccount[] = [
    { role: 'customer', label: 'Customer', email: 'customer@bossaconnect.app', password: 'Customer@123' },
    { role: 'driver', label: 'Driver', email: 'driver@bossaconnect.app', password: 'Driver@123' },
    { role: 'business', label: 'Business', email: 'business@bossaconnect.app', password: 'Business@123' },
    { role: 'admin', label: 'Admin', email: 'admin@bossaconnect.app', password: 'Admin@123' },
  ];

  constructor() {
    this.seed();
  }

  private seed(): void {
    const names: Record<UserRole, string> = {
      customer: 'Natasha Maila',
      driver: 'Tonny Maila',
      business: 'Noah Maako',
      admin: 'Admin: Fiona',
    };
    for (const account of this.demoAccounts) {
      this.users.set(account.email, {
        fullName: names[account.role],
        email: account.email,
        password: account.password,
        role: account.role,
      });
    }
  }

  login(email: string, password: string): string | null {
    const key = email.toLowerCase().trim();
    const user = this.users.get(key);
    if (!user) return 'No account found for this email.';
    if (user.password !== password) return 'Incorrect password. Please try again.';
    this.currentUserSig.set(user);
    return null;
  }

  register(fullName: string, email: string, password: string): string | null {
    const key = email.toLowerCase().trim();
    if (this.users.has(key)) {
      return 'An account with this email already exists.';
    }
    const user: User = { fullName: fullName.trim(), email: key, password, role: 'customer' };
    this.users.set(key, user);
    this.currentUserSig.set(user);
    return null;
  }

  logout(): void {
    this.currentUserSig.set(null);
  }

  /** Landing route for the signed-in user's role. */
  homePath(): string {
    return this.role() === 'customer' ? '/customer' : '/dashboard';
  }
}
