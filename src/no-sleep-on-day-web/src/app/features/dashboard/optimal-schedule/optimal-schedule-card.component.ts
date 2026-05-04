import { Component, computed, input } from '@angular/core';
import { AnalysisResult } from '../../../core/models/analysis';

@Component({
  selector: 'app-optimal-schedule-card',
  standalone: true,
  template: `
    @if (analysis(); as a) {
      <article class="optimal-card">
        <div class="optimal-card__icon" aria-hidden="true">💡</div>
        <div class="optimal-card__body">
          <h2 class="optimal-card__title">Оптимальное расписание</h2>
          <p class="optimal-card__lead">
            Подъём в <strong>{{ a.optimal.wakeTime }}</strong>, отбой в
            <strong>{{ a.optimal.sleepTime }}</strong>
          </p>
          <p class="optimal-card__detail">
            При таком расписании в среднем {{ optimalAvgPerDayLabel() }} в день света —
            {{ gainLabel() }} к текущему.
          </p>
          @if (a.optimal.clampedToBounds) {
            <p class="optimal-card__hint">
              ⚠ Оптимум упирается в разрешённый диапазон 04:00–10:00 — настоящий «лучший»
              подъём может лежать раньше или позже.
            </p>
          }
        </div>
      </article>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .optimal-card {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4);
        padding: var(--space-5) var(--space-6);
        background: linear-gradient(
          135deg,
          var(--color-warm-amber-fade) 0%,
          var(--color-surface) 60%
        );
        border: 1px solid var(--color-warm-amber-soft);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-soft);
      }
      .optimal-card__icon {
        font-size: 2rem;
        flex-shrink: 0;
      }
      .optimal-card__body {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .optimal-card__title {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--color-cool-indigo);
        margin: 0;
      }
      .optimal-card__lead {
        font-size: 1.4rem;
        font-weight: 700;
        margin: 0;
        color: var(--color-text);
      }
      .optimal-card__lead strong {
        color: var(--color-cool-indigo);
        font-variant-numeric: tabular-nums;
      }
      .optimal-card__detail {
        margin: 0;
        color: var(--color-text-muted);
      }
      .optimal-card__hint {
        margin: 0;
        margin-top: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--color-cool-indigo-fade);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        color: var(--color-cool-indigo);
      }
    `,
  ],
})
export class OptimalScheduleCardComponent {
  readonly analysis = input.required<AnalysisResult>();

  protected readonly optimalAvgPerDayLabel = computed(() => {
    const m = this.analysis().optimal.avgDaylightPerDay;
    if (m >= 60) {
      return `${(m / 60).toFixed(1).replace('.', ',')} ч`;
    }
    return `${m} мин`;
  });

  protected readonly gainLabel = computed(() => {
    const a = this.analysis();
    const gain = a.optimal.avgDaylightPerDay - a.current.avgDaylightPerDay;
    if (gain === 0) return 'столько же';
    const sign = gain > 0 ? '+' : '−';
    return `${sign}${Math.abs(gain)} мин/день`;
  });
}
