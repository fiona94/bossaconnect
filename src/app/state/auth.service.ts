import { Injectable, computed, signal } from '@angular/core';

export type UserRole = 'customer' | 'driver' | 'business' | 'admin';

export interface User {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  cellNumber?: string;
  /** Customer's default delivery area. */
  area?: string;
  /** Driver vehicle details. */
  vehicle?: string;
  plate?: string;
  rating?: number;
}

/** Profile fields a user is allowed to edit. */
export type ProfilePatch = Partial<Pick<User, 'fullName' | 'cellNumber' | 'area' | 'vehicle' | 'plate'>>;

/** Persisted profile edits (no passwords), keyed by email, so edits survive reloads. */
const OVERRIDES_KEY = 'bossa.profile.overrides';

/** A demo account surfaced in the "Quick demo sign-in" panel. */
export interface DemoAccount {
  role: UserRole;
  label: string;
  email: string;
  password: string;
}

interface SeedAccount extends DemoAccount {
  fullName: string;
  profile: Partial<User>;
  /** Seeded and usable, but hidden from the login screen's Quick demo panel. */
  hidden?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly users = new Map<string, User>();
  private readonly currentUserSig = signal<User | null>(null);

  readonly currentUser = this.currentUserSig.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUserSig() !== null);
  readonly role = computed<UserRole | null>(() => this.currentUserSig()?.role ?? null);

  /** Full seed data (name + profile defaults) for each demo account. */
  private readonly seedAccounts: SeedAccount[] = [
    { role: 'customer', label: 'Customer', email: 'customer@bossaconnect.app', password: 'Customer@123', fullName: 'Natasha Maila', profile: { cellNumber: '082 123 4567', area: 'Soweto, Zone 4' } },
    { role: 'driver', label: 'Driver', email: 'driver@bossaconnect.app', password: 'Driver@123', fullName: 'Tonny Maila', profile: { cellNumber: '083 555 9012', vehicle: 'Scooter · Honda', plate: 'GP 214 MT', rating: 4.8 } },
    { role: 'driver', label: 'Driver 2', email: 'driver2@bossaconnect.app', password: 'Driver@123', fullName: 'Lerato Phiri', hidden: true, profile: { cellNumber: '084 222 7788', vehicle: 'Motorbike · Yamaha', plate: 'GP 908 XT', rating: 4.9 } },
    { role: 'business', label: 'Business', email: 'business@bossaconnect.app', password: 'Business@123', fullName: 'Noah Maako', profile: {} },
    { role: 'admin', label: 'Admin', email: 'admin@bossaconnect.app', password: 'Admin@123', fullName: 'Admin: Fiona', profile: {} },
  ];

  /** Credentials shown on the login screen for quick access (hidden accounts excluded). */
  readonly demoAccounts: DemoAccount[] = this.seedAccounts
    .filter((a) => !a.hidden)
    .map(({ role, label, email, password }) => ({ role, label, email, password }));

  constructor() {
    this.seed();
  }

  private seed(): void {
    const overrides = this.readOverrides();
    for (const account of this.seedAccounts) {
      this.users.set(account.email, {
        fullName: account.fullName,
        email: account.email,
        password: account.password,
        role: account.role,
        ...account.profile,
        ...overrides[account.email],
      });
    }
  }

  private readOverrides(): Record<string, ProfilePatch> {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(OVERRIDES_KEY) : null;
      return raw ? (JSON.parse(raw) as Record<string, ProfilePatch>) : {};
    } catch {
      return {};
    }
  }

  private writeOverride(email: string, patch: ProfilePatch): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const all = this.readOverrides();
      all[email] = { ...all[email], ...patch };
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }

  /** Update the signed-in user's editable profile fields (persisted across reloads). */
  updateProfile(patch: ProfilePatch): void {
    const user = this.currentUserSig();
    if (!user) return;
    const next = { ...user, ...patch };
    this.users.set(user.email, next);
    this.currentUserSig.set(next);
    this.writeOverride(user.email, patch);
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

  /** All visible registered users (without passwords) — for the admin overview. Hidden demo accounts excluded. */
  listUsers(): Omit<User, 'password'>[] {
    const hidden = new Set(this.seedAccounts.filter((a) => a.hidden).map((a) => a.email));
    return [...this.users.values()]
      .filter((u) => !hidden.has(u.email))
      .map(({ password, ...rest }) => rest);
  }

  /** Landing route for the signed-in user's role. */
  homePath(): string {
    switch (this.role()) {
      case 'customer': return '/customer';
      case 'driver': return '/driver';
      case 'business': return '/business';
      case 'admin': return '/admin';
      default: return '/login';
    }
  }
}
