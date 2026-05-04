import { Component, input } from '@angular/core';

export type CardAccent = 'neutral' | 'cool' | 'warm';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  template: `
    <article class="card" [attr.data-accent]="accent()">
      <header class="card__title">{{ title() }}</header>
      <div class="card__value">
        <span class="card__value-number">{{ value() }}</span>
        <span class="card__value-unit">{{ unit() }}</span>
      </div>
      @if (subtitle(); as s) {
        <footer class="card__subtitle">{{ s }}</footer>
      }
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .card {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        padding: var(--space-5) var(--space-5);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-soft);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
        height: 100%;
      }
      .card[data-accent='warm'] {
        background: linear-gradient(
          145deg,
          var(--color-warm-amber-fade),
          var(--color-surface) 70%
        );
        border-color: var(--color-warm-amber-soft);
      }
      .card[data-accent='cool'] {
        background: linear-gradient(
          145deg,
          var(--color-cool-indigo-fade),
          var(--color-surface) 70%
        );
        border-color: var(--color-cool-indigo-soft);
      }
      .card__title {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-text-muted);
      }
      .card__value {
        display: flex;
        align-items: baseline;
        gap: var(--space-2);
      }
      .card__value-number {
        font-size: clamp(2.4rem, 4vw, 3.4rem);
        font-weight: 800;
        line-height: 1;
        color: var(--color-text);
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.01em;
      }
      .card[data-accent='warm'] .card__value-number {
        color: var(--color-cool-indigo);
      }
      .card__value-unit {
        font-size: 1rem;
        color: var(--color-text-muted);
        font-weight: 500;
      }
      .card__subtitle {
        font-size: 0.95rem;
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class SummaryCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly unit = input<string>('');
  readonly subtitle = input<string | null>(null);
  readonly accent = input<CardAccent>('neutral');
}
