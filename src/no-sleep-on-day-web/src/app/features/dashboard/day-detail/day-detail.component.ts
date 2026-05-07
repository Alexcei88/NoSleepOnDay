import { Component, computed, input, output } from '@angular/core';
import { DaylightSeriesPoint } from '../../../core/models/analysis';

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

@Component({
  selector: 'app-day-detail',
  standalone: true,
  template: `
    <div class="day-card">
      <div class="day-card__header">
        <span class="day-card__date">{{ dateLabel() }}</span>
        <button class="day-card__close" (click)="close.emit()" aria-label="Закрыть">✕</button>
      </div>

      <div class="day-card__grid">
        <div class="day-card__row">
          <span class="day-card__label">Восход</span>
          <span class="day-card__value">{{ point().sunriseLocal }}</span>
        </div>
        <div class="day-card__row">
          <span class="day-card__label">Заход</span>
          <span class="day-card__value">{{ point().sunsetLocal }}</span>
        </div>
        <div class="day-card__row">
          <span class="day-card__label">Длина дня</span>
          <span class="day-card__value">{{ dayLengthLabel() }}</span>
        </div>
        <div class="day-card__divider"></div>
        <div class="day-card__row">
          <span class="day-card__label">Свет в окне бодрствования сейчас</span>
          <span class="day-card__value">{{ point().currentMinutes }} мин</span>
        </div>
        <div class="day-card__row">
          <span class="day-card__label">Свет со сдвигом {{ shiftLabel() }}</span>
          <span class="day-card__value" [class.day-card__value--gain]="gain() > 0" [class.day-card__value--loss]="gain() < 0">
            {{ point().shiftedMinutes }} мин
            <span class="day-card__diff">{{ gainLabel() }}</span>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .day-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-soft);
      padding: var(--space-5);
    }

    .day-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    }

    .day-card__date {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-muted);
    }

    .day-card__close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      font-size: 1rem;
      line-height: 1;
      padding: 0 var(--space-1);
      &:hover { color: var(--color-text); }
    }

    .day-card__grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .day-card__row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--space-4);
    }

    .day-card__label {
      font-size: 0.82rem;
      color: var(--color-text-muted);
      flex-shrink: 0;
    }

    .day-card__value {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--color-text);
      text-align: right;
    }

    .day-card__value--gain { color: var(--color-gain, #1a7f3c); }
    .day-card__value--loss { color: var(--color-loss, #c0392b); }

    .day-card__diff {
      font-size: 0.78rem;
      font-weight: 500;
      margin-left: var(--space-2);
      opacity: 0.85;
    }

    .day-card__divider {
      height: 1px;
      background: var(--color-border);
      margin: var(--space-1) 0;
    }
  `],
})
export class DayDetailComponent {
  readonly point = input.required<DaylightSeriesPoint>();
  readonly shiftHours = input.required<number>();
  readonly close = output<void>();

  protected readonly dateLabel = computed(() => {
    const [yyyy, mm, dd] = this.point().date.split('-').map(Number);
    return `${dd} ${MONTHS_RU[mm - 1]} ${yyyy}`;
  });

  protected readonly dayLengthLabel = computed(() => {
    const mins = this.point().dayLengthMinutes;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  });

  protected readonly shiftLabel = computed(() => {
    const h = this.shiftHours();
    return h > 0 ? `+${h} ч` : `−${Math.abs(h)} ч`;
  });

  protected readonly gain = computed(() => this.point().shiftedMinutes - this.point().currentMinutes);

  protected readonly gainLabel = computed(() => {
    const g = this.gain();
    if (g === 0) return '±0 мин';
    const sign = g > 0 ? '+' : '−';
    return `${sign}${Math.abs(g)} мин`;
  });
}
