import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Service {
  icon: string;
  title: string;
  description: string;
}

interface BenefitGroup {
  audience: string;
  tag: string;
  intro: string;
  members: string[];
  benefits: string[];
}

interface Step {
  number: string;
  title: string;
  description: string;
}

interface PricingPlan {
  name: string;
  badge?: string;
  highlight: boolean;
  headline: string;
  detail: string;
  points: string[];
}

interface RoadmapPhase {
  version: string;
  title: string;
  features: string[];
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  protected readonly menuOpen = signal(false);

  protected readonly navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'How It Works', href: '#how' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  protected readonly services: Service[] = [
    {
      icon: 'food',
      title: 'Food Delivery',
      description: 'Order from nearby restaurants and takeaways with a driver dispatched automatically.',
    },
    {
      icon: 'grocery',
      title: 'Grocery Delivery',
      description: 'Spaza shops and supermarkets bring the whole basket straight to your door.',
    },
    {
      icon: 'pharmacy',
      title: 'Pharmacy Delivery',
      description: 'Collect and deliver medicine and essentials from local pharmacies, safely.',
    },
    {
      icon: 'parcel',
      title: 'Parcel Delivery',
      description: 'Send packages across the township with live tracking and proof of delivery.',
    },
    {
      icon: 'shuttle',
      title: 'Shuttle Services',
      description: 'Request a nearby ride, see the fare upfront and track your trip in real time.',
    },
    {
      icon: 'shopping',
      title: 'Personal Shopping',
      description: 'A trusted local shopper picks up exactly what you need, when you need it.',
    },
  ];

  protected readonly benefitGroups: BenefitGroup[] = [
    {
      audience: 'Customers',
      tag: 'For everyone',
      intro: 'Faster, transparent and reliable service from providers right in your community.',
      members: [],
      benefits: [
        'Faster service',
        'Transparent pricing',
        'Live driver tracking',
        'Secure payments',
        'Driver ratings',
        'Reliable, accountable service',
      ],
    },
    {
      audience: 'Local Businesses',
      tag: 'For merchants',
      intro: 'Restaurants, spaza shops, supermarkets, liquor stores, pharmacies and takeaways.',
      members: ['Restaurants', 'Spaza shops', 'Supermarkets', 'Liquor stores', 'Pharmacies', 'Takeaways'],
      benefits: [
        'More customers',
        'Delivery without hiring drivers',
        'More orders',
        'Better customer experience',
      ],
    },
    {
      audience: 'Drivers',
      tag: 'For earners',
      intro: 'Scooter drivers, private car owners and motorbike owners earning on their terms.',
      members: ['Scooter drivers', 'Private car owners', 'Motorbike owners'],
      benefits: [
        'More trips',
        'Continuous income',
        'Less time looking for customers',
        'Digital record of earnings',
      ],
    },
  ];

  protected readonly steps: Step[] = [
    { number: '01', title: 'Open the app', description: 'Choose the service you need — delivery, shuttle or personal shopping.' },
    { number: '02', title: 'Set your location', description: 'Enter your delivery or trip destination and see pricing upfront.' },
    { number: '03', title: 'Nearest driver accepts', description: 'Registered drivers nearby receive the request and the closest one accepts.' },
    { number: '04', title: 'Track live', description: 'Follow your driver in real time from pickup all the way to your door.' },
    { number: '05', title: 'Pay & rate', description: 'Payment is released on completion and you rate the driver — full accountability.' },
  ];

  protected readonly pricing: PricingPlan[] = [
    {
      name: 'Commission',
      badge: 'Recommended',
      highlight: true,
      headline: '15%',
      detail: 'per completed trip',
      points: [
        'On a R50 delivery, the driver keeps R42.50',
        'Platform earns R7.50',
        'No monthly cost to drivers',
        'Pay only when you earn',
      ],
    },
    {
      name: 'Subscription',
      highlight: false,
      headline: 'R199',
      detail: 'per driver / month',
      points: [
        'Unlimited access to the platform',
        'Zero commission on trips',
        'Predictable flat monthly fee',
        'Best for high-volume drivers',
      ],
    },
    {
      name: 'Hybrid',
      badge: 'Best value',
      highlight: false,
      headline: '10% + Premium',
      detail: 'commission plus subscription',
      points: [
        'Lower 10% commission',
        'Priority ride & delivery requests',
        'Earnings analytics',
        'In-app advertising & promotion',
      ],
    },
  ];

  protected readonly commissions = [
    { category: 'Pharmacy', rate: '8%' },
    { category: 'Restaurants', rate: '10%' },
    { category: 'Shops', rate: '10%' },
    { category: 'Groceries', rate: '10%' },
    { category: 'Liquor', rate: '12%' },
    { category: 'Parcel delivery', rate: '15%' },
  ];

  protected readonly roadmap: RoadmapPhase[] = [
    {
      version: 'Version 1 — MVP',
      title: 'Launch the core platform',
      features: [
        'Customer, driver & business registration',
        'Request delivery or shuttle',
        'GPS tracking & driver acceptance',
        'Ratings, payments & notifications',
        'Trip history & admin dashboard',
      ],
    },
    {
      version: 'Version 2',
      title: 'Grow the ecosystem',
      features: [
        'Courier & school transport',
        'Scheduled & group deliveries',
        'Business dashboards & driver wallet',
        'Referral rewards & promo codes',
        'Driver subscriptions',
      ],
    },
    {
      version: 'Version 3',
      title: 'Everything local, one app',
      features: [
        'Medicine, gas & water delivery',
        'Township marketplace & laundry',
        'On-demand mechanic, plumber, electrician',
        'Home cleaning & beauty services',
        'Emergency assistance',
      ],
    },
  ];

  protected readonly advantages = [
    'Built specifically for townships',
    'Understands the cash economy',
    'Designed around local road conditions',
    'Works where communities are underserved',
    'Community driven & affordable',
    'Flexible for informal drivers',
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
