import { Component, effect, inject } from '@angular/core';
import { NotificationService } from '../state/notification.service';

@Component({
  selector: 'app-toast-host',
  template: `
    <div class="toast-wrap" aria-live="polite">
      @for (t of notify.toasts(); track t.id) {
        <div class="toast" [attr.data-tone]="t.tone">
          <span class="t-icon" aria-hidden="true">
            @switch (t.tone) {
              @case ('success') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg> }
              @case ('warn') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg> }
              @default { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg> }
            }
          </span>
          <div class="t-body">
            <strong>{{ t.title }}</strong>
            <span>{{ t.body }}</span>
          </div>
          <button type="button" class="t-close" (click)="notify.dismissToast(t.id)" aria-label="Dismiss">×</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-wrap {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 200;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: min(360px, calc(100vw - 32px));
      }
      .toast {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: #fff;
        border: 1px solid var(--line);
        border-left: 4px solid var(--slate-400);
        border-radius: 12px;
        padding: 13px 14px;
        box-shadow: var(--shadow-lg);
        animation: slide-in 0.24s ease;
      }
      .toast[data-tone='success'] { border-left-color: var(--emerald-500); }
      .toast[data-tone='warn'] { border-left-color: #d9534f; }
      .toast[data-tone='info'] { border-left-color: var(--navy-800); }
      .t-icon {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: var(--surface-alt);
        color: var(--slate-600);
      }
      .toast[data-tone='success'] .t-icon { background: rgba(29,185,84,0.14); color: var(--green-700); }
      .toast[data-tone='warn'] .t-icon { background: #fdecec; color: #b4231f; }
      .toast[data-tone='info'] .t-icon { background: rgba(10,31,68,0.08); color: var(--navy-800); }
      .t-icon svg { width: 17px; height: 17px; }
      .t-body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
      .t-body strong { color: var(--navy-800); font-size: 0.92rem; }
      .t-body span { color: var(--slate-600); font-size: 0.84rem; }
      .t-close {
        background: none;
        border: none;
        color: var(--slate-400);
        font-size: 1.2rem;
        line-height: 1;
        cursor: pointer;
        padding: 0 2px;
      }
      .t-close:hover { color: var(--navy-800); }
      @keyframes slide-in {
        from { transform: translateY(12px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `,
  ],
})
export class ToastHost {
  protected notify = inject(NotificationService);
  private scheduled = new Set<string>();

  constructor() {
    // Auto-dismiss each toast a few seconds after it appears.
    effect(() => {
      for (const t of this.notify.toasts()) {
        if (this.scheduled.has(t.id)) continue;
        this.scheduled.add(t.id);
        setTimeout(() => this.notify.dismissToast(t.id), 5200);
      }
    });
  }
}
