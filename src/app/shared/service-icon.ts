import { Component, input } from '@angular/core';
import { ServiceKey } from '../state/customer.service';

@Component({
  selector: 'app-service-icon',
  template: `
    @switch (key()) {
      @case ('food') {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 3v7a2 2 0 0 0 2 2h0V3M6 3v18M18 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9"/></svg>
      }
      @case ('grocery') {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 4h2l2.4 12.3a1 1 0 0 0 1 .7h8.7a1 1 0 0 0 1-.8L21 8H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>
      }
      @case ('pharmacy') {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8V6a4 4 0 0 1 8 0v2M12 12v4M10 14h4"/></svg>
      }
      @case ('parcel') {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3.3 7 12 3l8.7 4v10L12 21l-8.7-4V7Z"/><path d="M3.3 7 12 11l8.7-4M12 11v10"/></svg>
      }
      @case ('shuttle') {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 13l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5v4h-2M3 17v-4M5 17h14"/><circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/></svg>
      }
      @case ('shopping') {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
      }
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      svg {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class ServiceIcon {
  readonly key = input.required<ServiceKey>();
}
