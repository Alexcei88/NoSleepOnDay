import { Component, computed, input } from '@angular/core';
import { AnalysisResult, ShiftNeighbor } from '../../../core/models/analysis';
import { SummaryCardComponent } from './summary-card.component';
import {
  formatGain,
  formatPerDay,
  formatPerDayGain,
  formatTotalMinutes,
} from './daylight-format';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [SummaryCardComponent],
  template: `
    @if (analysis(); as a) {
      <div class="summary-grid">
        <app-summary-card
          accent="cool"
          title="Сейчас"
          [value]="currentTotal().value"
          [unit]="currentTotal().unit"
          [subtitle]="currentPerDay()"
        />
        <app-summary-card
          accent="cool"
          [title]="shiftedTitle()"
          [value]="shiftedTotal().value"
          [unit]="shiftedTotal().unit"
          [subtitle]="shiftedPerDay()"
        />
        <app-summary-card
          accent="warm"
          title="Разница"
          [value]="deltaTotal().value"
          [unit]="deltaTotal().unit"
          [subtitle]="deltaPerDay()"
        />
      </div>
      @if (neighborHints().length) {
        <div class="neighbor-hints">
          @for (hint of neighborHints(); track hint.shift) {
            <div class="neighbor-hint" [class.neighbor-hint--better]="hint.better">
              <span class="neighbor-hint__arrow">{{ hint.shift < analysis().shiftHours ? '←' : '→' }}</span>
              <span class="neighbor-hint__label">{{ hint.shiftLabel }}</span>
              <span class="neighbor-hint__value">{{ hint.gainLabel }}</span>
              @if (hint.diffLabel) {
                <span class="neighbor-hint__diff" [class.neighbor-hint__diff--better]="hint.better">{{ hint.diffLabel }}</span>
              }
            </div>
          }
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-4);
      }
      @media (max-width: 768px) {
        .summary-grid {
          grid-template-columns: 1fr;
        }
      }
      .neighbor-hints {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-top: var(--space-3);
        padding-top: var(--space-3);
        border-top: 1px solid var(--color-border);
      }
      .neighbor-hint {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        background: rgba(30, 42, 110, 0.05);
        border: 1px solid rgba(30, 42, 110, 0.1);
        color: var(--color-text);
      }
      .neighbor-hint--better {
        background: rgba(21, 128, 61, 0.07);
        border-color: rgba(21, 128, 61, 0.2);
      }
      .neighbor-hint__arrow {
        font-size: 0.85rem;
        color: var(--color-text-muted);
      }
      .neighbor-hint__label {
        font-weight: 600;
        color: var(--color-cool-indigo);
      }
      .neighbor-hint__value {
        color: var(--color-text-muted);
      }
      .neighbor-hint__diff {
        font-weight: 700;
        color: var(--color-text-muted);
        margin-left: 2px;
      }
      .neighbor-hint__diff--better {
        color: #15803d;
      }
    `,
  ],
})
export class SummaryCardsComponent {
  readonly analysis = input.required<AnalysisResult>();

  protected readonly dayCount = computed(() => this.analysis().series.length);

  protected readonly neighborHints = computed(() => {
    const a = this.analysis();
    return (a.shiftNeighbors ?? []).map((n: ShiftNeighbor) => {
      const sign = n.shiftHours > 0 ? '+' : '−';
      const shiftLabel = `${sign}${Math.abs(n.shiftHours)} ч`;
      const gainFormatted = formatGain(n.totalGainMinutes, this.dayCount());
      const gainLabel = `${gainFormatted.value} ${gainFormatted.unit}`;
      const diff = n.totalGainMinutes - a.delta.totalGainMinutes;
      const better = diff < 0;
      const diffAbs = Math.abs(diff);
      const diffHours = diffAbs / 60;
      const diffLabel =
        diffAbs < 30
          ? `${better ? '−' : '+'}${Math.round(diffAbs)} мин`
          : `${better ? '−' : '+'}${Math.round(diffHours)} ч`;
      return { shift: n.shiftHours, shiftLabel, gainLabel, better, diffLabel };
    });
  });

  protected readonly shiftedTitle = computed(() => {
    const s = this.analysis().shiftHours;
    return `Если ${formatShift(s)} к часовому поясу`;
  });

  protected readonly currentTotal = computed(() =>
    formatTotalMinutes(this.analysis().current.totalDaylightMinutes, this.dayCount()),
  );
  protected readonly shiftedTotal = computed(() =>
    formatTotalMinutes(this.analysis().shifted.totalDaylightMinutes, this.dayCount()),
  );
  protected readonly deltaTotal = computed(() =>
    formatGain(this.analysis().delta.totalGainMinutes, this.dayCount()),
  );

  protected readonly currentPerDay = computed(() => {
    const f = formatPerDay(this.analysis().current.avgDaylightPerDay);
    return `≈ ${f.value} ${f.unit}`;
  });
  protected readonly shiftedPerDay = computed(() => {
    const f = formatPerDay(this.analysis().shifted.avgDaylightPerDay);
    return `≈ ${f.value} ${f.unit}`;
  });
  protected readonly deltaPerDay = computed(() => {
    const f = formatPerDayGain(this.analysis().delta.avgGainPerDay);
    return `≈ ${f.value} ${f.unit}`;
  });
}

function formatShift(hours: number): string {
  const sign = hours > 0 ? '+' : '−';
  return `${sign}${Math.abs(hours)} ч`;
}
