import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { AuthService, UserRole } from './auth.service';

export type NotificationTone = 'info' | 'success' | 'warn';

export interface AppNotification {
  id: string;
  /** Target a specific user by email, or a whole role (e.g. all drivers). */
  forEmail?: string;
  forRole?: UserRole;
  tone: NotificationTone;
  title: string;
  body: string;
  ts: number;
  orderId?: string;
  read: boolean;
}

const STORAGE_KEY = 'bossa.notifications';
/** Keep the store from growing without bound. */
const MAX = 60;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private auth = inject(AuthService);
  private zone = inject(NgZone);

  private readonly allSig = signal<AppNotification[]>([]);
  private readonly toastSig = signal<AppNotification[]>([]);
  /** Only surface toasts for notifications created after this service came alive. */
  private lastToastTs = Date.now();

  readonly toasts = this.toastSig.asReadonly();

  /** Notifications addressed to the signed-in user, newest first. */
  readonly mine = computed<AppNotification[]>(() => {
    const user = this.auth.currentUser();
    if (!user) return [];
    return this.allSig()
      .filter((n) => this.isForMe(n, user.email, user.role))
      .sort((a, b) => b.ts - a.ts);
  });

  readonly unreadCount = computed(() => this.mine().filter((n) => !n.read).length);

  constructor() {
    this.allSig.set(this.read());
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.zone.run(() => {
            this.allSig.set(this.read());
            this.surfaceToasts();
          });
        }
      });
    }
  }

  private isForMe(n: AppNotification, email: string, role: UserRole): boolean {
    if (n.forEmail) return n.forEmail === email;
    if (n.forRole) return n.forRole === role;
    return false;
  }

  /** Append a notification to the shared store (visible to its target in any tab). */
  push(n: Omit<AppNotification, 'id' | 'ts' | 'read'>): void {
    const notif: AppNotification = {
      ...n,
      id: 'N' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000),
      ts: Date.now(),
      read: false,
    };
    const next = [notif, ...this.read()].slice(0, MAX);
    this.write(next);
    this.allSig.set(next);
    this.surfaceToasts();
  }

  /** Show a one-off toast to the current user without storing it (no bell entry, no cross-tab). */
  flash(tone: NotificationTone, title: string, body: string): void {
    const t: AppNotification = {
      id: 'F' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000),
      tone,
      title,
      body,
      ts: Date.now(),
      read: true,
    };
    this.toastSig.update((list) => [...list, t]);
  }

  markAllRead(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const next = this.read().map((n) =>
      this.isForMe(n, user.email, user.role) ? { ...n, read: true } : n,
    );
    this.write(next);
    this.allSig.set(next);
  }

  dismissToast(id: string): void {
    this.toastSig.update((list) => list.filter((t) => t.id !== id));
  }

  private surfaceToasts(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const fresh = this.allSig()
      .filter((n) => n.ts > this.lastToastTs && this.isForMe(n, user.email, user.role))
      .sort((a, b) => a.ts - b.ts);
    if (!fresh.length) return;
    this.lastToastTs = Math.max(this.lastToastTs, ...fresh.map((n) => n.ts));
    this.toastSig.update((list) => [...list, ...fresh]);
  }

  private read(): AppNotification[] {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return raw ? (JSON.parse(raw) as AppNotification[]) : [];
    } catch {
      return [];
    }
  }

  private write(next: AppNotification[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      /* ignore */
    }
  }
}
