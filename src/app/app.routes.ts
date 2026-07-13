import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './state/auth.service';

const requireAuth = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

const requireCustomer = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.role() !== 'customer') {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  { path: 'register', loadComponent: () => import('./pages/register/register').then((m) => m.Register) },
  {
    path: 'customer',
    canActivate: [requireCustomer],
    loadComponent: () => import('./pages/customer/customer-shell').then((m) => m.CustomerShell),
    children: [
      { path: '', loadComponent: () => import('./pages/customer/home/home').then((m) => m.CustomerHome) },
      { path: 'request/:service', loadComponent: () => import('./pages/customer/request/request').then((m) => m.RequestFlow) },
      { path: 'track/:id', loadComponent: () => import('./pages/customer/track/track').then((m) => m.TrackOrder) },
      { path: 'orders', loadComponent: () => import('./pages/customer/orders/orders').then((m) => m.CustomerOrders) },
      { path: 'profile', loadComponent: () => import('./pages/customer/profile/profile').then((m) => m.CustomerProfile) },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [requireAuth],
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  { path: '**', redirectTo: '' },
];
