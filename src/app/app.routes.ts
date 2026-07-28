import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserRole } from './state/auth.service';

const requireRole = (role: UserRole) => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  if (auth.role() !== role) {
    router.navigate([auth.homePath()]);
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
    canActivate: [requireRole('customer')],
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
    path: 'driver',
    canActivate: [requireRole('driver')],
    loadComponent: () => import('./pages/driver/driver-shell').then((m) => m.DriverShell),
    children: [
      { path: '', loadComponent: () => import('./pages/driver/requests/requests').then((m) => m.DriverRequests) },
      { path: 'trip', loadComponent: () => import('./pages/driver/trip/trip').then((m) => m.DriverTrip) },
      { path: 'earnings', loadComponent: () => import('./pages/driver/earnings/earnings').then((m) => m.DriverEarnings) },
      { path: 'profile', loadComponent: () => import('./pages/driver/profile/profile').then((m) => m.DriverProfile) },
    ],
  },
  {
    path: 'business',
    canActivate: [requireRole('business')],
    loadComponent: () => import('./pages/business/business-shell').then((m) => m.BusinessShell),
    children: [
      { path: '', loadComponent: () => import('./pages/business/orders/orders').then((m) => m.BusinessOrders) },
      { path: 'history', loadComponent: () => import('./pages/business/history/history').then((m) => m.BusinessHistory) },
      { path: 'profile', loadComponent: () => import('./pages/business/profile/profile').then((m) => m.BusinessProfile) },
    ],
  },
  {
    path: 'admin',
    canActivate: [requireRole('admin')],
    loadComponent: () => import('./pages/admin/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', loadComponent: () => import('./pages/admin/overview/overview').then((m) => m.AdminOverview) },
      { path: 'people', loadComponent: () => import('./pages/admin/people/people').then((m) => m.AdminPeople) },
      { path: 'profile', loadComponent: () => import('./pages/admin/profile/profile').then((m) => m.AdminProfile) },
    ],
  },
  { path: '**', redirectTo: '' },
];
