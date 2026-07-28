import { Component, inject, signal } from '@angular/core';
import { NotificationService } from '../state/notification.service';

@Component({
  selector: 'app-notification-bell',
  template: `
    <div class="bell-wrap">
      <button type="button" class="bell-btn" (click)="toggle()" aria-label="Notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        @if (notify.unreadCount() > 0) {
          <span class="bell-badge">{{ notify.unreadCount() }}</span>
        }
      </button>

      @if (open()) {
        <div class="bell-backdrop" (click)="close()"></div>
        <div class="bell-panel" role="dialog" aria-label="Notifications">
          <div class="bell-head"><strong>Notifications</strong></div>
          @if (notify.mine().length) {
            <ul class="bell-list">
              @for (n of notify.mine(); track n.id) {
                <li [attr.data-tone]="n.tone">
                  <span class="dot" aria-hidden="true"></span>
                  <div>
                    <strong>{{ n.title }}</strong>
                    <span>{{ n.body }}</span>
                  </div>
                </li>
              }
            </ul>
          } @else {
            <div class="bell-empty">No notifications yet.</div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .bell-wrap { position: relative; display: inline-flex; }
      .bell-btn {
        position: relative;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.16);
        color: #fff;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .bell-btn:hover { background: rgba(255, 255, 255, 0.16); }
      .bell-btn svg { width: 20px; height: 20px; }
      .bell-badge {
        position: absolute;
        top: -3px;
        right: -3px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 999px;
        background: var(--orange-500);
        color: #fff;
        font-size: 0.68rem;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--navy-800);
      }
      .bell-backdrop { position: fixed; inset: 0; z-index: 60; }
      .bell-panel {
        position: absolute;
        top: 46px;
        right: 0;
        z-index: 61;
        width: 320px;
        max-width: calc(100vw - 32px);
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 14px;
        box-shadow: var(--shadow-lg);
        overflow: hidden;
      }
      .bell-head {
        padding: 14px 16px;
        border-bottom: 1px solid var(--line);
        color: var(--navy-800);
      }
      .bell-list {
        list-style: none;
        margin: 0;
        padding: 6px;
        max-height: 360px;
        overflow-y: auto;
      }
      .bell-list li {
        display: flex;
        gap: 10px;
        padding: 11px 12px;
        border-radius: 10px;
      }
      .bell-list li:hover { background: var(--surface-alt); }
      .bell-list .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 6px;
        flex-shrink: 0;
        background: var(--slate-400);
      }
      .bell-list li[data-tone='success'] .dot { background: var(--emerald-500); }
      .bell-list li[data-tone='warn'] .dot { background: #d9534f; }
      .bell-list li[data-tone='info'] .dot { background: var(--navy-800); }
      .bell-list strong { display: block; color: var(--navy-800); font-size: 0.88rem; }
      .bell-list span { color: var(--slate-600); font-size: 0.82rem; }
      .bell-empty { padding: 28px 16px; text-align: center; color: var(--slate-600); font-size: 0.9rem; }
    `,
  ],
})
export class NotificationBell {
  protected notify = inject(NotificationService);
  protected readonly open = signal(false);

  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) this.notify.markAllRead();
  }

  protected close(): void {
    this.open.set(false);
  }
}
