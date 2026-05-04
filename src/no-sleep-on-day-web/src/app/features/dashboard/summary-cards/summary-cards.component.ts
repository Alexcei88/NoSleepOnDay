import { Component, computed, input } from '@angular/core';
import { AnalysisResult } from '../../../core/models/analysis';
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
          title="Если +1 час к часовому поясу"
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
    `,
  ],
})
export class SummaryCardsComponent {
  readonly analysis = input.required<AnalysisResult>();

  protected readonly dayCount = computed(() => this.analysis().series.length);

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
