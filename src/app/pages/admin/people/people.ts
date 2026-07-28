import { Component, computed, inject } from '@angular/core';
import { AuthService, User, UserRole } from '../../../state/auth.service';

type SafeUser = Omit<User, 'password'>;

@Component({
  selector: 'app-admin-people',
  templateUrl: './people.html',
  styleUrl: './people.css',
})
export class AdminPeople {
  private auth = inject(AuthService);

  protected readonly groups = computed<{ role: UserRole; title: string; users: SafeUser[] }[]>(() => {
    const users = this.auth.listUsers();
    const defs: { role: UserRole; title: string }[] = [
      { role: 'customer', title: 'Customers' },
      { role: 'driver', title: 'Drivers' },
      { role: 'business', title: 'Businesses' },
      { role: 'admin', title: 'Admins' },
    ];
    return defs.map((d) => ({ ...d, users: users.filter((u) => u.role === d.role) }));
  });

  protected detail(u: SafeUser): string {
    if (u.role === 'driver') return u.vehicle ?? '—';
    if (u.role === 'customer') return u.area ?? '—';
    return u.cellNumber ?? '—';
  }
}
